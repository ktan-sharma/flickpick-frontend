// Preference survey disabled - Firebase removed, Django backend version TODO
// This file is kept for future implementation of user preferences

export async function maybeShowSurvey() {
    // Disabled - preferences will be handled via Django backend API
    // TODO: Implement Django preferences endpoint
    return;
}

// Don't auto-run on DOMContentLoaded - prevents errors
// document.addEventListener('DOMContentLoaded', maybeShowSurvey);
