# app/models/__init__.py
# Порядок импортов важен: сначала базовые модели без внешних ссылок,
# потом модели, которые на них ссылаются.

from app.db.base import Base  # noqa

# 1. Auth — нет внешних ссылок
from app.modules.auth.models import User, ApiToken  # noqa

# 1.5 Calendar — ссылается на User
from app.modules.calendar.models import CalendarEventModel  # noqa

# 2. Projects — ссылается на User
from app.modules.projects.models import (  # noqa
    Project,
    Stage,
    Kit,
    Section,
)

# 3. Operations — ссылается на Project
from app.modules.operations.models import (  # noqa
    Operation,
    OperationAssignment,
    WorkCenter,
)

# 4. Routes — ссылается на Project
from app.modules.routes.models import Route  # noqa

# 5. Tasks — ссылается на Project, User
from app.modules.tasks.models import Task  # noqa

# 6. Documents — ссылается на Project, Stage, Kit, Section, Operation, User
from app.modules.documents.models import (  # noqa
    Document,
    Revision,
    ChangeSheet,
    ApprovalWorkflow,
    ApprovalStage,
    DocumentDependency,
)

# 7. Remarks — ссылается на Project, User
from app.modules.remarks.models import (  # noqa
    Remark,
    RemarkComment,
    RemarkTag,
)

# 8. Variables — ссылается на Document
from app.modules.variables.models import (  # noqa
    Variable,
    VariableRevision,
)

# 9. Time tracking — ссылается на Project, User
from app.modules.time_tracking.models import (  # noqa
    TimeSession,
    EmployeeLoad,
)

# 10. Tenders — ссылается на Project
from app.modules.tenders.models import (  # noqa
    Tender,
    TenderDocumentPreview,
)

# 11. Workflow — ссылается на Project, User
from app.modules.workflow.models import (  # noqa
    WorkflowTemplate,
    WorkflowInstance,
    WorkflowStep,
    WorkflowComment,
    WorkflowAuditLog,
)

# 12. Gamification — ссылается на User
from app.modules.gamification.models import (  # noqa
    EngineerMetric,
    GamificationEvent,
    GamificationBadge,
    DailyQuest,
    ComboAchievement,
    Notification,
)

# 13. Archive — ссылается на Project, User
from app.models.archive import (  # noqa
    ArchiveEntry,
    ArchiveMaterial,
    ArchiveConstruction,
    ArchiveSearchIndex,
)

# 14. Audit — ссылается на User
from app.models.audit import AuditLog as AuditLogModel  # noqa

# 15. Releases / Support / SRM — без внешних ссылок (SRM ссылается на Project по строке)
from app.modules.releases.models import Release  # noqa
from app.modules.support.models import SupportTicket, Incident, KBArticle  # noqa
from app.modules.srm.models import (  # noqa
    Supplier,
    Customer,
    PurchaseRequest,
    Contract,
    PurchaseOrder,
    Invoice,
)
from app.modules.production.models import (  # noqa
    ProdDepartment,
    ProdEmployee,
    ProdProcessNode,
    ProdProcessEdge,
    ProdProblem,
)
from app.modules.employees.models import EmployeeProfile  # noqa
