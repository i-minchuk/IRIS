#!/usr/bin/env python3
"""Проверка архитектуры проекта на циклические зависимости."""

import ast
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, Set, List


class ImportChecker:
    """Check imports between modules."""
    
    def __init__(self, base_path: str = None):
        if base_path is None:
            base_path = Path(__file__).parent.parent / "app" / "modules"
        self.base_path = Path(base_path)
        self.imports: Dict[str, Set[str]] = defaultdict(set)
        self.errors: List[str] = []
    
    def scan(self):
        """Сканировать все модули."""
        print(f"Scanning modules in {self.base_path}...")
        
        for module_dir in sorted(self.base_path.iterdir()):
            if not module_dir.is_dir() or module_dir.name.startswith("_"):
                continue
            
            module_name = module_dir.name
            self.imports[module_name] = set()
            
            for py_file in module_dir.glob("*.py"):
                if py_file.name == "__init__.py":
                    continue
                    
                self._parse_file(py_file, module_name)
    
    def _parse_file(self, file_path: Path, current_module: str):
        """Parse file and extract imports."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read())
        except SyntaxError as e:
            self.errors.append(f"Syntax error in {file_path}: {e}")
            return
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self._check_import(alias.name, current_module)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    self._check_import(node.module, current_module)
    
    def _check_import(self, import_path: str, current_module: str):
        """Check import."""
        if not import_path.startswith("app.modules"):
            return
        
        parts = import_path.split(".")
        if len(parts) < 3:
            return
        
        imported_module = parts[2]
        
        # Ignore self imports
        if imported_module == current_module:
            return
        
        # Ignore imports from core, db, api.deps
        if imported_module in ["core", "db", "api"]:
            return
        
        self.imports[current_module].add(imported_module)
    
    def check_cyclic(self) -> bool:
        """Check for cyclic dependencies."""
        print("\nChecking cyclic dependencies...")
        
        has_cycles = False
        
        for module_a, deps_a in self.imports.items():
            for module_b in deps_a:
                if module_a in self.imports.get(module_b, set()):
                    has_cycles = True
                    self.errors.append(
                        f"Cyclic dependency: {module_a} <-> {module_b}"
                    )
        
        return has_cycles
    
    def check_router_cleanliness(self) -> bool:
        """Check that routers don't import models from other modules directly."""
        print("\nChecking router cleanliness...")
        
        has_violations = False
        
        # Define modules that should have clean routers (no direct model imports)
        clean_modules = ["documents", "resources"]
        
        for module in clean_modules:
            module_dir = self.base_path / module
            if not module_dir.exists():
                continue
            
            router_file = module_dir / "router.py"
            if not router_file.exists():
                continue
            
            try:
                with open(router_file, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Check for direct model imports from other modules
                # Allow User import for get_current_active_user dependency
                forbidden_patterns = [
                    "from app.modules.projects.models import",
                    "from app.modules.documents.models import",
                    "from app.modules.time_tracking.models import",
                    "from app.modules.variables.models import",
                    "from app.modules.collaboration.models import",
                    "from app.modules.analytics.models import",
                    "from app.modules.gamification.models import",
                    "from app.modules.tenders.models import",
                    "from app.modules.tasks.models import",
                ]
                
                for pattern in forbidden_patterns:
                    if pattern in content:
                        has_violations = True
                        self.errors.append(
                            f"Router in {module} imports models directly: {pattern}"
                        )
                
                # Check that router uses service layer
                if "service" not in content.lower():
                    has_violations = True
                    self.errors.append(
                        f"Router in {module} does not use service layer"
                    )
                    
            except Exception as e:
                self.errors.append(f"Error checking {router_file}: {e}")
        
        return has_violations
    
    def check_repository_service_layers(self) -> bool:
        """Check that refactored modules have repository and service layers."""
        print("\nChecking repository/service layers...")
        
        has_violations = False
        
        # Define modules that should have repository/service layers
        layered_modules = ["documents", "resources"]
        
        for module in layered_modules:
            module_dir = self.base_path / module
            if not module_dir.exists():
                continue
            
            # Check for repository.py
            repository_file = module_dir / "repository.py"
            if not repository_file.exists():
                has_violations = True
                self.errors.append(
                    f"Module {module} is missing repository.py"
                )
            
            # Check for service.py
            service_file = module_dir / "service.py"
            if not service_file.exists():
                has_violations = True
                self.errors.append(
                    f"Module {module} is missing service.py"
                )
            
            # Check for deps.py
            deps_file = module_dir / "deps.py"
            if not deps_file.exists():
                has_violations = True
                self.errors.append(
                    f"Module {module} is missing deps.py"
                )
        
        return has_violations
    
    def check_authorization(self) -> bool:
        """Check authorized dependencies."""
        print("\nChecking authorized dependencies...")
        
        # Define allowed dependencies based on business logic
        # Source: docs/ARCHITECTURE.md
        allowed_deps = {
            # Level 0 (base modules)
            "auth": set(),  # auth does not depend on other modules
            "core": set(),  # core utilities
            "db": set(),    # database layer
            
            # Level 1 (business entities)
            "documents": {"auth", "projects", "variables"},  # Documents relate to projects and use variables
            "projects": {"auth"},  # Projects are independent
            "tasks": {"auth", "projects"},  # Tasks belong to projects
            "tenders": {"auth", "documents"},  # Tenders work with documents
            "variables": {"auth"},  # Variables are independent
            
            # Level 2 (overlays)
            "collaboration": {"auth", "documents"},  # Collaboration on documents
            "time_tracking": {"auth", "projects", "tasks"},  # Time tracking for projects and tasks
            "analytics": {"auth", "documents", "projects", "time_tracking"},  # Analytics from multiple sources
            "gamification": {"auth", "documents", "projects"},  # Gamification based on activity
            "resources": {"auth", "documents", "projects", "time_tracking"},  # Shared resources
        }
        
        has_violations = False
        
        for module, deps in self.imports.items():
            allowed = allowed_deps.get(module, set())
            unauthorized = deps - allowed
            
            if unauthorized:
                has_violations = True
                self.errors.append(
                    f"Module {module} imports unauthorized modules: {unauthorized}. "
                    f"Allowed: {allowed or 'none'}"
                )
        
        return has_violations
    
    def report(self):
        """Print report."""
        print("\n" + "=" * 60)
        print("Dependencies Report")
        print("=" * 60)
        
        print("\nModule dependencies:")
        for module, deps in sorted(self.imports.items()):
            if deps:
                print(f"  {module}: {', '.join(sorted(deps))}")
            else:
                print(f"  {module}: (no dependencies)")
        
        if self.errors:
            print("\nErrors:")
            for error in self.errors:
                print(f"  {error}")
        else:
            print("\nNo errors found!")
        
        print("\n" + "=" * 60)
    
    def check(self) -> bool:
        """Run all checks."""
        self.scan()
        
        cyclic = self.check_cyclic()
        authorization = self.check_authorization()
        router_clean = self.check_router_cleanliness()
        layers_exist = self.check_repository_service_layers()
        
        self.report()
        
        return not (cyclic or authorization or router_clean or layers_exist)


def main():
    """Main function."""
    print("Architecture Check for DokPotok IRIS\n")
    
    checker = ImportChecker()
    success = checker.check()
    
    if success:
        print("\nAll checks passed!")
        sys.exit(0)
    else:
        print("\nIssues found, requires fixing")
        sys.exit(1)


if __name__ == "__main__":
    main()
