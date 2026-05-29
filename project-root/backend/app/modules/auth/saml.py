# app/modules/auth/saml.py
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from app.core.config import settings

SAML_CONFIG = {
    "strict": True,
    "debug": settings.DEBUG,
    "sp": {
        "entityId": f"{settings.BASE_URL}/auth/saml/metadata",
        "assertionConsumerService": {
            "url": f"{settings.BASE_URL}/auth/saml/acs",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
        },
        "singleLogoutService": {
            "url": f"{settings.BASE_URL}/auth/saml/sls",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
        },
        "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        "x509cert": settings.SAML_SP_CERT,
        "privateKey": settings.SAML_SP_KEY,
    },
    "idp": {
        "entityId": settings.SAML_IDP_ENTITY_ID,
        "singleSignOnService": {
            "url": settings.SAML_IDP_SSO_URL,
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
        },
        "x509cert": settings.SAML_IDP_CERT,
    },
}


def init_saml_auth(req):
    return OneLogin_Saml2_Auth(req, SAML_CONFIG)


def prepare_request(request):
    """Convert FastAPI Request to dict expected by OneLogin_Saml2_Auth."""
    return {
        "https": "on" if request.url.scheme == "https" else "off",
        "http_host": request.headers.get("host", "localhost"),
        "server_port": request.url.port or (443 if request.url.scheme == "https" else 80),
        "script_name": request.url.path,
        "get_data": dict(request.query_params),
        "post_data": {},
    }
