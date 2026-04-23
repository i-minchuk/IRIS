"""Tests for architecture and dependencies."""

import pytest
import subprocess
import sys
from pathlib import Path


class TestArchitecture:
    """Test architecture constraints."""
    
    def test_no_cyclic_dependencies(self):
        """Check for cyclic dependencies between modules."""
        script_path = Path(__file__).parent.parent / "backend" / "scripts" / "check_architecture.py"
        
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
        
        assert "No errors found!" in result.stdout
        assert "All checks passed!" in result.stdout
    
    def test_auth_module_isolation(self):
        """Test that auth module has no dependencies on other business modules."""
        script_path = Path(__file__).parent.parent / "backend" / "scripts" / "check_architecture.py"
        
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True
        )
        
        # Check that auth has no dependencies in the report
        assert "auth: (no dependencies)" in result.stdout
    
    def test_documents_module_dependencies(self):
        """Test that documents module has expected dependencies."""
        script_path = Path(__file__).parent.parent / "backend" / "scripts" / "check_architecture.py"
        
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True
        )
        
        # Check that documents has auth, projects, variables dependencies
        assert "documents: auth, projects, variables" in result.stdout
    
    def test_analytics_module_dependencies(self):
        """Test that analytics module has expected dependencies."""
        script_path = Path(__file__).parent.parent / "backend" / "scripts" / "check_architecture.py"
        
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True
        )
        
        # Check that analytics has auth, documents, projects, time_tracking dependencies
        assert "analytics: auth, documents, projects, time_tracking" in result.stdout
