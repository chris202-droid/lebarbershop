from rest_framework import permissions


class EstProprietaireOuAdmin(permissions.BasePermission):
    """Seuls le propriétaire du salon ou un administrateur du SAAS peuvent modifier."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if user.est_admin_principal or user.est_admin_secondaire:
            return True
        return obj.proprietaire_id == user.id


class EstAdminPrincipal(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.est_admin_principal)


class EstAdminAvecDroit(permissions.BasePermission):
    """Vérifie un droit précis attribué à un administrateur secondaire."""
    droit_requis = None

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.est_admin_principal:
            return True
        if user.est_admin_secondaire and hasattr(user, "droits"):
            return getattr(user.droits, self.droit_requis, False)
        return False
