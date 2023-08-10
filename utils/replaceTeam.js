const TEAM_MEMBER_MAP = {
    'assigneeIdFromCSV': 'assigneeEmailInLinear'
};

export const getTeamMemberName = (assignee) => {
    return TEAM_MEMBER_MAP[assignee] || null;
}