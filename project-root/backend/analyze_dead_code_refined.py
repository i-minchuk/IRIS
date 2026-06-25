#!/usr/bin/env python3
"""
Refined dead code analyzer for ДокПоток IRIS backend.

Strategy:
1. Collect all definitions (classes, functions, top-level variables) across all .py files.
2. Collect all references (Name/Attribute Load contexts) across all files, INCLUDING same-file.
3. A name is "potentially unused" only if it has ZERO references anywhere.
4. Additionally, flag schemas/classes that are never instantiated (no ClassName() calls).
5. Exclude common dunder methods (__init__, __repr__, etc.) and FastAPI decorator targets
   (functions used as router handlers are referenced by the decorator, but AST may not show a Load ref).

We add special handling for FastAPI routers: functions decorated with @router.* or @app.*
are considered "used" because they are endpoint handlers.
"""

import ast
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional

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


class DefinitionCollector(ast.NodeVisitor):
    """Collect top-level definitions in a module."""

    def __init__(self, module_path: str):
        self.module_path = module_path
        self.module_name = self._module_name(module_path)
        self.classes: Set[str] = set()
        self.functions: Set[str] = set()
        self.variables: Set[str] = set()
        self.imports: Dict[str, str] = {}
        self.from_imports: Dict[str, Tuple[str, str]] = {}
        self._fastapi_handlers: Set[str] = set()  # functions decorated with @router.* or @app.*

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
        if name.startswith("router.") or name.startswith("app.") or name.startswith("APIRouter"):
            return True
        if isinstance(decorator, ast.Call):
            return self._is_fastapi_decorator(decorator.func)
        return False

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name = alias.asname if alias.asname else alias.name
            self.imports[name] = alias.name
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        module = node.module or ""
        for alias in node.names:
            name = alias.asname if alias.asname else alias.name
            self.from_imports[name] = (module, alias.name)
        self.generic_visit(node)

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
    """Collect all Name and Attribute references in a file (Load context only)."""

    def __init__(self):
        self.names: Set[str] = set()
        self.attrs: Set[str] = set()
        self.calls: Set[str] = set()  # function/class calls (Call nodes)
        self.instantiations: Set[str] = set()  # ClassName() calls

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

    # Global reference sets
    all_names: Set[str] = set()
    all_attrs: Set[str] = set()
    all_calls: Set[str] = set()
    all_instantiations: Set[str] = set()
    for refs in file_refs.values():
        all_names.update(refs.names)
        all_attrs.update(refs.attrs)
        all_calls.update(refs.calls)
        all_instantiations.update(refs.instantiations)

    # Exclude dunder names and common patterns
    def is_special(name: str) -> bool:
        return name.startswith("__") and name.endswith("__")

    unused_items: List[Tuple[str, str, str, str]] = []  # (path, kind, name, reason)

    for path, defs in file_defs.items():
        # --- Classes ---
        for name in defs.classes:
            if is_special(name):
                continue
            # Check if referenced anywhere (name or attribute)
            ref_count = (1 if name in all_names else 0) + sum(1 for a in all_attrs if a.endswith("." + name))
            # Check if instantiated
            instantiated = name in all_instantiations
            # Check if used as base class (in class definition)
            used_as_base = False
            for other_defs in file_defs.values():
                # We can't easily detect base classes from our collected data, but we can check attrs
                pass
            # If never referenced by name/attr and not instantiated, it's likely dead
            # Exception: Pydantic schemas are often only used as type hints; AST doesn't capture type hints in all versions.
            # We do a simple check: if the class name appears in any annotation in any file.
            # For simplicity, just do a text search for the name in annotations.
            in_annotations = False
            if ref_count == 0 and not instantiated:
                # Text-based check for type annotations
                for fpath in files:
                    with open(fpath, "r", encoding="utf-8") as fh:
                        content = fh.read()
                    if f": {name}" in content or f"[{name}]" in content or f"[{name}," in content or f", {name}]" in content or f"-> {name}" in content or f"| {name}" in content:
                        in_annotations = True
                        break
            if ref_count == 0 and not instantiated and not in_annotations:
                unused_items.append((path, "class", name, "never referenced or instantiated"))
            elif ref_count > 0 and not instantiated and not in_annotations:
                # Referenced but never instantiated — possible dead schema
                # Only flag if it's in a schemas.py file and not a base class
                if "schemas.py" in path or "dto.py" in path or "models.py" in path:
                    unused_items.append((path, "class", name, "referenced but never instantiated (possible unused schema/model)"))

        # --- Functions ---
        for name in defs.functions:
            if is_special(name):
                continue
            if name in defs._fastapi_handlers:
                continue  # FastAPI handlers are used by the framework
            ref_count = (1 if name in all_names else 0) + sum(1 for a in all_attrs if a.endswith("." + name))
            if ref_count == 0:
                unused_items.append((path, "function", name, "never called"))

        # --- Variables ---
        for name in defs.variables:
            if name.startswith("_"):
                continue  # private/module-level vars are often intentional
            if name in all_names or name in all_attrs:
                continue
            unused_items.append((path, "variable", name, "never referenced"))

    # Group by module
    grouped = defaultdict(list)
    for path, kind, name, reason in unused_items:
        grouped[path].append((kind, name, reason))

    output_lines = []
    output_lines.append("=" * 80)
    output_lines.append("REFINED DEAD CODE ANALYSIS")
    output_lines.append("=" * 80)
    output_lines.append(f"Total files scanned: {len(files)}")
    output_lines.append(f"Potentially unused items: {len(unused_items)}")
    output_lines.append("")
    output_lines.append("Notes:")
    output_lines.append("- FastAPI router handlers (decorated with @router.*) are EXCLUDED — they are used by the framework.")
    output_lines.append("- Dunder methods (__init__, __repr__, etc.) are EXCLUDED.")
    output_lines.append("- Private names (_prefix) are EXCLUDED from variable analysis.")
    output_lines.append("- Classes in schemas.py/models.py flagged as 'referenced but never instantiated' may be")
    output_lines.append("  used only as Pydantic type hints; verify manually before removal.")
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

    # Summary by module
    output_lines.append("\n")
    output_lines.append("=" * 80)
    output_lines.append("TOP MODULES BY COUNT OF POTENTIALLY UNUSED ITEMS")
    output_lines.append("=" * 80)
    module_counts = defaultdict(int)
    for path, items in grouped.items():
        rel = os.path.relpath(path, str(APP_DIR))
        module_counts[rel] += len(items)
    for rel, count in sorted(module_counts.items(), key=lambda x: -x[1])[:40]:
        output_lines.append(f"{count:3d}  {rel}")

    output_text = "\n".join(output_lines)
    print(output_text)

    out_path = Path(__file__).resolve().parent / "dead_code_report_refined.txt"
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(output_text)
    print(f"\n\nFull report saved to: {out_path}")


if __name__ == "__main__":
    main()
