import { useAuth } from '../hooks/useAuth';
import { useCompetitionData } from '../hooks/useCompetitionData';
import { isSuperUser } from '../config';

export const useAuthPermissions = () => {
    const { user } = useAuth();
    const { campaignRole } = useCompetitionData();

    // Enhanced security: Explicit role checking with fallback to deny
    const userRole = user?.role?.toLowerCase().trim();
    const campaignRoleClean = campaignRole?.toLowerCase().trim();

    const isSuper = isSuperUser(userRole);
    const isAdmin = userRole === 'admin' || campaignRoleClean === 'admin' || campaignRoleClean === 'competition_admin';
    const isCampaignSuper = campaignRoleClean === 'superuser' || campaignRoleClean === 'super_user';
    const isTeacher = campaignRoleClean === 'teacher';

    const canAccessAdmin = isSuper || isAdmin || isCampaignSuper;
    const canAccessVote = isSuper || isAdmin || isTeacher;

    return {
        isSuper,
        isAdmin,
        isCampaignSuper,
        isTeacher,
        canAccessAdmin,
        canAccessVote,
        userRole,
        campaignRole: campaignRoleClean
    };
};
