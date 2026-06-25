#!/usr/bin/env python3
"""
Dead code analyzer for the ДокПоток IRIS backend.

Parses all .py files under app/ (excluding __pycache__, alembic, tests),
collects definitions (classes, functions, top-level variables/constants),
and counts references across all files.

Reports names defined but never referenced outside their own file.
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
    """Return dotted name for an attribute chain, e.g. schemas.UserCreate."""
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
        self.imports: Dict[str, str] = {}   # alias -> full dotted name
        self.from_imports: Dict[str, Tuple[str, str]] = {}  # alias -> (module, name)

    def _module_name(self, path: str) -> str:
        rel = os.path.relpath(path, str(APP_DIR))
        rel = rel.replace(os.sep, ".")
        if rel.endswith(".py"):
            rel = rel[:-3]
        if rel.endswith(".__init__"):
            rel = rel[:-9]
        return rel

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
        # do NOT descend into class body to avoid picking nested methods as top-level defs

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.functions.add(node.name)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self.functions.add(node.name)

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
    """Collect all Name and Attribute references in a file."""

    def __init__(self):
        self.names: Set[str] = set()          # bare names
        self.attrs: Set[str] = set()          # dotted references

    def visit_Name(self, node: ast.Name):
        self.names.add(node.id)

    def visit_Attribute(self, node: ast.Attribute):
        self.attrs.add(get_full_name(node))
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

    # Per-file data
    file_defs: Dict[str, DefinitionCollector] = {}
    file_refs: Dict[str, ReferenceCollector] = {}

    for path in files:
        try:
            defs, refs, _ = parse_file(path)
            file_defs[path] = defs
            file_refs[path] = refs
        except SyntaxError as e:
            print(f"Syntax error in {path}: {e}")

    # Build global reference sets
    all_names: Set[str] = set()
    all_attrs: Set[str] = set()
    for refs in file_refs.values():
        all_names.update(refs.names)
        all_attrs.update(refs.attrs)

    # Helper: resolve a name to possible full dotted names via imports
    def possible_references(name: str, defs: DefinitionCollector) -> Set[str]:
        """Given a name used in some file, return possible forms it could take."""
        refs = {name}
        if name in defs.imports:
            refs.add(defs.imports[name])
        if name in defs.from_imports:
            mod, orig = defs.from_imports[name]
            refs.add(f"{mod}.{orig}")
        return refs

    # For each definition, check if it is referenced anywhere outside its own file.
    # We consider:
    #   - bare name match
    #   - attribute match where the prefix resolves to the defining module
    unused: List[Tuple[str, str, str]] = []   # (path, kind, name)

    for path, defs in file_defs.items():
        # Determine module path prefix for attribute matching
        mod_prefix = defs.module_name
        mod_parts = mod_prefix.split(".")

        for name in defs.classes:
            referenced = False
            for other_path, other_refs in file_refs.items():
                if other_path == path:
                    continue
                # Check bare name
                if name in other_refs.names:
                    referenced = True
                    break
                # Check attribute references: e.g. schemas.UserCreate
                # Could be direct module.attr or via import alias
                for attr in other_refs.attrs:
                    if attr == f"{mod_prefix}.{name}":
                        referenced = True
                        break
                    # Also check if imported via from_imports
                    for alias, (mod, orig) in file_defs[other_path].from_imports.items():
                        if orig == name:
                            # If imported from our module
                            full_mod = ".".join(mod_parts[:-1]) + "." + mod if mod_parts else mod
                            # Simplistic: if attr starts with alias or mod
                            if attr.startswith(f"{alias}.") or attr.startswith(f"{mod}."):
                                referenced = True
                                break
                    if referenced:
                        break
                if referenced:
                    break
            if not referenced:
                unused.append((path, "class", name))

        for name in defs.functions:
            referenced = False
            for other_path, other_refs in file_refs.items():
                if other_path == path:
                    continue
                if name in other_refs.names:
                    referenced = True
                    break
                for attr in other_refs.attrs:
                    if attr == f"{mod_prefix}.{name}":
                        referenced = True
                        break
                if referenced:
                    break
            if not referenced:
                unused.append((path, "function", name))

        for name in defs.variables:
            referenced = False
            for other_path, other_refs in file_refs.items():
                if other_path == path:
                    continue
                if name in other_refs.names:
                    referenced = True
                    break
                for attr in other_refs.attrs:
                    if attr == f"{mod_prefix}.{name}":
                        referenced = True
                        break
                if referenced:
                    break
            if not referenced:
                unused.append((path, "variable", name))

    # Group by module directory
    grouped = defaultdict(list)
    for path, kind, name in unused:
        grouped[path].append((kind, name))

    # Output
    output_lines = []
    output_lines.append("=" * 70)
    output_lines.append("DEAD CODE ANALYSIS SUMMARY")
    output_lines.append("=" * 70)
    output_lines.append(f"Total files scanned: {len(files)}")
    output_lines.append(f"Potentially unused items: {len(unused)}")
    output_lines.append("")

    # Sort by path, then by kind priority
    kind_order = {"class": 0, "function": 1, "variable": 2}
    for path in sorted(grouped.keys()):
        items = grouped[path]
        items.sort(key=lambda x: (kind_order.get(x[0], 99), x[1]))
        rel = os.path.relpath(path, str(APP_DIR))
        output_lines.append(f"\n{rel}")
        output_lines.append("-" * len(rel))
        for kind, name in items:
            output_lines.append(f"  [{kind:9}] {name}")

    # Also produce a flat list sorted by module for easier reading
    output_lines.append("\n")
    output_lines.append("=" * 70)
    output_lines.append("TOP UNUSED ITEMS BY MODULE (count)")
    output_lines.append("=" * 70)
    module_counts = defaultdict(int)
    for path, items in grouped.items():
        rel = os.path.relpath(path, str(APP_DIR))
        module_counts[rel] += len(items)
    for rel, count in sorted(module_counts.items(), key=lambda x: -x[1])[:30]:
        output_lines.append(f"{count:3d}  {rel}")

    output_text = "\n".join(output_lines)
    print(output_text)

    out_path = Path(__file__).resolve().parent / "dead_code_report.txt"
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(output_text)
    print(f"\n\nFull report saved to: {out_path}")


if __name__ == "__main__":
    main()
