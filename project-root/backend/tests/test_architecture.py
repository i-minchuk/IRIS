"""Tests for architecture and dependencies."""

import pytest
import subprocess
import sys
from pathlib import Path


@pytest.mark.architecture
class TestArchitecture:
    """Test architecture constraints."""

    @pytest.fixture(scope="class")
    def architecture_report(self):
        """Run architecture check once and parse output."""
        script_path = Path(__file__).parent.parent / "scripts" / "check_architecture.py"

        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True
        )

        assert result.returncode == 0, (
            "Architecture check failed!\n"
            f"STDOUT: {result.stdout}\n"
            f"STDERR: {result.stderr}"
        )

        return result.stdout

    def test_no_cyclic_dependencies(self, architecture_report):
        """Check for cyclic dependencies between modules."""
        assert "No errors found!" in architecture_report
        assert "All checks passed!" in architecture_report

    def test_auth_module_isolation(self, architecture_report):
        """Test that auth module has no dependencies on other business modules."""
        assert "auth: (no dependencies)" in architecture_report

    def test_documents_module_dependencies(self, architecture_report):
        """Test that documents module has expected dependencies."""
        assert "documents: auth, gamification, operations, projects, variables" in architecture_report

    def test_analytics_module_dependencies(self, architecture_report):
        """Test that analytics module has expected dependencies."""
        assert "analytics: auth, documents, gamification, projects, remarks, tasks, tenders, time_tracking" in architecture_report

    def test_resources_module_dependencies(self, architecture_report):
        """Test that resources module has expected dependencies."""
        assert "resources: auth, documents, projects, time_tracking" in architecture_report

    def test_router_cleanliness(self, architecture_report):
        """Test that refactored routers don't import models directly."""
        assert "No errors found!" in architecture_report

    def test_repository_service_layers_exist(self):
        """Test that refactored modules have repository and service layers."""
        # Check documents module
        documents_path = Path(__file__).parent.parent / "app" / "modules" / "documents"
        assert (documents_path / "repository.py").exists(), "documents/repository.py missing"
        assert (documents_path / "service.py").exists(), "documents/service.py missing"
        assert (documents_path / "deps.py").exists(), "documents/deps.py missing"

        # Check resources module
        resources_path = Path(__file__).parent.parent / "app" / "modules" / "resources"
        assert (resources_path / "repository.py").exists(), "resources/repository.py missing"
        assert (resources_path / "service.py").exists(), "resources/service.py missing"
        assert (resources_path / "deps.py").exists(), "resources/deps.py missing"
