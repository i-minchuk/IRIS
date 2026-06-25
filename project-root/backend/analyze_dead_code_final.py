#!/usr/bin/env python3
"""
Final dead code analyzer for ДокПоток IRIS backend.

Improvements over previous passes:
- Uses AST-based type annotation extraction (function args, returns, AnnAssign)
  to detect schema/model usage as type hints.
- Still excludes FastAPI handlers (decorated with @router.* / @app.*).
- Still excludes dunder methods.
- Still excludes private variables (_prefix).
- Reports only items that are genuinely unreferenced: no Name/Attribute references,
  no instantiations, no type annotations, no base-class usage, no decorator usage.
"""

import ast
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

APP_DIR = Path(__file__).resolve().parent / "app"

# ---------------------------------------------------------------------------
# AST helpers
# ---------------------------------------------------------------------------

def get_full_name(node: ast.AST) -> str:
    parts = []
    while isinstance(node, ast.Attribute):
        parts.append(node.attr)
        node = node.value
    if isinstance(node, ast.Name):
        parts.append(node.id)
    return ".".join(reversed(parts))


def extract_type_names(node: ast.AST) -> Set[str]:
    """Recursively extract all names used in a type annotation AST node."""
    names = set()
    if isinstance(node, ast.Name):
        names.add(node.id)
    elif isinstance(node, ast.Attribute):
        names.add(get_full_name(node))
    elif isinstance(node, ast.Subscript):
        names.update(extract_type_names(node.value))
        if hasattr(node, "slice"):
            sl = node.slice
            if isinstance(sl, ast.Tuple):
                for elt in sl.elts:
                    names.update(extract_type_names(elt))
            else:
                names.update(extract_type_names(sl))
    elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.BitOr):
        names.update(extract_type_names(node.left))
        names.update(extract_type_names(node.right))
    elif isinstance(node, ast.Constant) and isinstance(node.value, str):
        # Forward reference string
        names.add(node.value)
    elif isinstance(node, ast.List):
        for elt in node.elts:
            names.update(extract_type_names(elt))
    elif isinstance(node, ast.Tuple):
        for elt in node.elts:
            names.update(extract_type_names(elt))
    return names


class DefinitionCollector(ast.NodeVisitor):
    def __init__(self, module_path: str):
        self.module_path = module_path
        self.module_name = self._module_name(module_path)
        self.classes: Set[str] = set()
        self.functions: Set[str] = set()
        self.variables: Set[str] = set()
        self._fastapi_handlers: Set[str] = set()

    def _module_name(self, path: str) -> str:
        rel = os.path.relpath(path, str(APP_DIR))
        rel = rel.replace(os.sep, ".")
        if rel.endswith(".py"):
            rel = rel[:-3]
        if rel.endswith(".__init__"):
            rel = rel[:-9]
        return rel

    def _is_fastapi_decorator(self, decorator: ast.expr) -> bool:
        name = get_full_name(decorator)
        if name.startswith("router.") or name.startswith("app."):
            return True
        if isinstance(decorator, ast.Call):
            return self._is_fastapi_decorator(decorator.func)
        return False

    def visit_ClassDef(self, node: ast.ClassDef):
        self.classes.add(node.name)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.functions.add(node.name)
        if any(self._is_fastapi_decorator(d) for d in node.decorator_list):
            self._fastapi_handlers.add(node.name)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self.functions.add(node.name)
        if any(self._is_fastapi_decorator(d) for d in node.decorator_list):
            self._fastapi_handlers.add(node.name)

    def visit_Assign(self, node: ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.variables.add(target.id)
            elif isinstance(target, ast.Tuple):
                for elt in target.elts:
                    if isinstance(elt, ast.Name):
                        self.variables.add(elt.id)

    def visit_AnnAssign(self, node: ast.AnnAssign):
        if isinstance(node.target, ast.Name):
            self.variables.add(node.target.id)


class ReferenceCollector(ast.NodeVisitor):
    def __init__(self):
        self.names: Set[str] = set()
        self.attrs: Set[str] = set()
        self.calls: Set[str] = set()
        self.instantiations: Set[str] = set()
        self.type_annotations: Set[str] = set()
        self.base_classes: Set[str] = set()
        self.decorators: Set[str] = set()

    def visit_Name(self, node: ast.Name):
        if isinstance(node.ctx, ast.Load):
            self.names.add(node.id)

    def visit_Attribute(self, node: ast.Attribute):
        if isinstance(node.ctx, ast.Load):
            self.attrs.add(get_full_name(node))
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            self.calls.add(node.func.id)
            self.instantiations.add(node.func.id)
        elif isinstance(node.func, ast.Attribute):
            self.calls.add(get_full_name(node.func))
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        for d in node.decorator_list:
            self.decorators.update(extract_type_names(d))
        if node.returns:
            self.type_annotations.update(extract_type_names(node.returns))
        for arg in node.args.args + node.args.posonlyargs + node.args.kwonlyargs:
            if arg.annotation:
                self.type_annotations.update(extract_type_names(arg.annotation))
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self.visit_FunctionDef(node)  # reuse

    def visit_AnnAssign(self, node: ast.AnnAssign):
        if node.annotation:
            self.type_annotations.update(extract_type_names(node.annotation))
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        for base in node.bases:
            self.base_classes.update(extract_type_names(base))
        for d in node.decorator_list:
            self.decorators.update(extract_type_names(d))
        self.generic_visit(node)


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------

def collect_files() -> List[str]:
    files = []
    for root, _dirs, filenames in os.walk(APP_DIR):
        if "__pycache__" in root:
            continue
        if "alembic" in root:
            continue
        if "tests" in root:
            continue
        for f in filenames:
            if f.endswith(".py"):
                files.append(os.path.join(root, f))
    return files


def parse_file(path: str) -> Tuple[DefinitionCollector, ReferenceCollector, ast.AST]:
    with open(path, "r", encoding="utf-8") as fh:
        source = fh.read()
    tree = ast.parse(source, filename=path)
    defs = DefinitionCollector(path)
    defs.visit(tree)
    refs = ReferenceCollector()
    refs.visit(tree)
    return defs, refs, tree


def main():
    files = collect_files()
    print(f"Scanning {len(files)} Python files...\n")

    file_defs: Dict[str, DefinitionCollector] = {}
    file_refs: Dict[str, ReferenceCollector] = {}

    for path in files:
        try:
            defs, refs, _ = parse_file(path)
            file_defs[path] = defs
            file_refs[path] = refs
        except SyntaxError as e:
            print(f"Syntax error in {path}: {e}")

    # Global sets
    all_names: Set[str] = set()
    all_attrs: Set[str] = set()
    all_calls: Set[str] = set()
    all_instantiations: Set[str] = set()
    all_type_annotations: Set[str] = set()
    all_base_classes: Set[str] = set()
    all_decorators: Set[str] = set()

    for refs in file_refs.values():
        all_names.update(refs.names)
        all_attrs.update(refs.attrs)
        all_calls.update(refs.calls)
        all_instantiations.update(refs.instantiations)
        all_type_annotations.update(refs.type_annotations)
        all_base_classes.update(refs.base_classes)
        all_decorators.update(refs.decorators)

    def is_special(name: str) -> bool:
        return name.startswith("__") and name.endswith("__")

    unused_items: List[Tuple[str, str, str, str]] = []

    for path, defs in file_defs.items():
        # Classes
        for name in defs.classes:
            if is_special(name):
                continue
            reasons = []
            if name in all_names or any(a.endswith("." + name) for a in all_attrs):
                pass  # referenced
            else:
                reasons.append("no name/attr refs")
            if name not in all_instantiations:
                reasons.append("never instantiated")
            if name not in all_type_annotations and name not in all_base_classes:
                reasons.append("not in type hints or base classes")
            if len(reasons) >= 3:
                unused_items.append((path, "class", name, "; ".join(reasons)))
            elif len(reasons) == 2 and "no name/attr refs" in reasons and "never instantiated" in reasons:
                # Might still be used as type hint only
                if name not in all_type_annotations:
                    unused_items.append((path, "class", name, "; ".join(reasons)))

        # Functions
        for name in defs.functions:
            if is_special(name):
                continue
            if name in defs._fastapi_handlers:
                continue
            if name not in all_names and not any(a.endswith("." + name) for a in all_attrs):
                # Also check if used as decorator target (e.g. @functools.wraps(func))
                if name not in all_decorators:
                    unused_items.append((path, "function", name, "never called or referenced"))

        # Variables (top-level)
        for name in defs.variables:
            if name.startswith("_"):
                continue
            if name not in all_names and not any(a.endswith("." + name) for a in all_attrs):
                unused_items.append((path, "variable", name, "never referenced"))

    grouped = defaultdict(list)
    for path, kind, name, reason in unused_items:
        grouped[path].append((kind, name, reason))

    output_lines = []
    output_lines.append("=" * 80)
    output_lines.append("FINAL DEAD CODE ANALYSIS")
    output_lines.append("=" * 80)
    output_lines.append(f"Total files scanned: {len(files)}")
    output_lines.append(f"Potentially unused items: {len(unused_items)}")
    output_lines.append("")
    output_lines.append("Notes:")
    output_lines.append("- FastAPI handlers (@router.*) EXCLUDED")
    output_lines.append("- Dunder methods EXCLUDED")
    output_lines.append("- Private variables (_prefix) EXCLUDED")
    output_lines.append("- Type annotations, base classes, and instantiations are CHECKED")
    output_lines.append("")

    kind_order = {"class": 0, "function": 1, "variable": 2}
    for path in sorted(grouped.keys()):
        items = grouped[path]
        items.sort(key=lambda x: (kind_order.get(x[0], 99), x[1]))
        rel = os.path.relpath(path, str(APP_DIR))
        output_lines.append(f"\n{rel}")
        output_lines.append("-" * len(rel))
        for kind, name, reason in items:
            output_lines.append(f"  [{kind:9}] {name:<45}  ({reason})")

    output_lines.append("\n")
    output_lines.append("=" * 80)
    output_lines.append("TOP MODULES BY COUNT")
    output_lines.append("=" * 80)
    module_counts = defaultdict(int)
    for path, items in grouped.items():
        rel = os.path.relpath(path, str(APP_DIR))
        module_counts[rel] += len(items)
    for rel, count in sorted(module_counts.items(), key=lambda x: -x[1])[:40]:
        output_lines.append(f"{count:3d}  {rel}")

    output_text = "\n".join(output_lines)
    print(output_text)

    out_path = Path(__file__).resolve().parent / "dead_code_report_final.txt"
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(output_text)
    print(f"\n\nFull report saved to: {out_path}")


if __name__ == "__main__":
    main()
