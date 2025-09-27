
// Debug script to check admin access issue
async function debugAdminAccess() {
  try {
    console.log('=== Debugging Admin Access Issue ===');

    // Get current user info
    const { data: userInfo, error: userError } = await window.ezsite.apis.getUserInfo();
    console.log('User Info:', userInfo, 'Error:', userError);

    if (userInfo) {
      // Check user_roles table for this user
      const { data: rolesData, error: rolesError } = await window.ezsite.apis.tablePage(44174, {
        PageNo: 1,
        PageSize: 10,
        Filters: [
        { name: 'user_id', op: 'Equal', value: userInfo.ID }]

      });
      console.log('User Roles Data:', rolesData, 'Error:', rolesError);

      // Check all admin roles in the system
      const { data: adminRoles, error: adminError } = await window.ezsite.apis.tablePage(44174, {
        PageNo: 1,
        PageSize: 10,
        Filters: [
        { name: 'role_name', op: 'Equal', value: 'admin' }]

      });
      console.log('All Admin Roles:', adminRoles, 'Error:', adminError);

      // If no admin role exists for this user, create one
      if (rolesData && rolesData.List.length === 0) {
        console.log('Creating admin role for user:', userInfo.ID);
        const { error: createError } = await window.ezsite.apis.tableCreate(44174, {
          user_id: userInfo.ID,
          role_name: 'admin',
          permissions: JSON.stringify(['full_access']),
          granted_by: userInfo.ID, // Self-granted for initial setup
          granted_at: new Date().toISOString(),
          is_active: true
        });
        console.log('Create admin role result:', createError);

        if (!createError) {
          alert('Admin role created successfully! Please refresh the page.');
        }
      }
    }
  } catch (err) {
    console.error('Debug error:', err);
  }
}

// Auto-run when script loads
debugAdminAccess();