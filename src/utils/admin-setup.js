
// Quick admin setup utility
// Run this in browser console or include in a page to grant admin access

async function grantAdminAccess() {
  try {
    console.log('Starting admin setup...');

    // Get current user
    const { data: userInfo, error: userError } = await window.ezsite.apis.getUserInfo();
    if (userError) {
      console.error('User info error:', userError);
      alert('Please log in first: ' + userError);
      return;
    }

    if (!userInfo) {
      alert('Please log in first');
      return;
    }

    console.log('Current user:', userInfo);

    // Check if admin role already exists
    const { data: existingRole, error: checkError } = await window.ezsite.apis.tablePage(44174, {
      PageNo: 1,
      PageSize: 10,
      Filters: [
      { name: 'user_id', op: 'Equal', value: userInfo.ID },
      { name: 'role_name', op: 'Equal', value: 'admin' }]

    });

    if (checkError) {
      console.error('Check role error:', checkError);
      alert('Error checking existing role: ' + checkError);
      return;
    }

    if (existingRole && existingRole.List && existingRole.List.length > 0) {
      console.log('Admin role already exists:', existingRole.List[0]);

      // Update to make sure it's active
      const role = existingRole.List[0];
      const { error: updateError } = await window.ezsite.apis.tableUpdate(44174, {
        id: role.id,
        user_id: userInfo.ID,
        role_name: 'admin',
        permissions: JSON.stringify(['full_access']),
        granted_by: userInfo.ID,
        granted_at: new Date().toISOString(),
        is_active: true
      });

      if (updateError) {
        console.error('Update role error:', updateError);
        alert('Error updating admin role: ' + updateError);
        return;
      }

      alert('Admin role updated successfully! You can now access the admin panel.');
    } else {
      // Create new admin role
      console.log('Creating new admin role...');
      const { error: createError } = await window.ezsite.apis.tableCreate(44174, {
        user_id: userInfo.ID,
        role_name: 'admin',
        permissions: JSON.stringify(['full_access']),
        granted_by: userInfo.ID,
        granted_at: new Date().toISOString(),
        is_active: true
      });

      if (createError) {
        console.error('Create role error:', createError);
        alert('Error creating admin role: ' + createError);
        return;
      }

      alert('Admin role created successfully! You can now access the admin panel.');
    }

    // Redirect to admin panel
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1000);

  } catch (error) {
    console.error('Admin setup error:', error);
    alert('Error during admin setup: ' + error.message);
  }
}

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined' && window.ezsite) {
  grantAdminAccess();
}

// Export for manual use
window.grantAdminAccess = grantAdminAccess;