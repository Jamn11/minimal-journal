// Security and Password Management Module
class SecurityManager {
  constructor(uiManager, utils) {
    this.uiManager = uiManager;
    this.utils = utils;
    this.failedPasswordAttempts = 0;
    this.lockoutEndTime = null;
    this.sessionTimeout = null;
  }

  // Password Protection Methods
  async isPasswordProtectionEnabled() {
    try {
      return await window.electronAPI.isPasswordProtectionEnabled();
    } catch (error) {
      console.error('Error checking password protection status:', error);
      return false;
    }
  }

  async verifyPassword(password) {
    try {
      const result = await window.electronAPI.verifyPassword(password);
      return result.success;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async setPassword(password) {
    try {
      const result = await window.electronAPI.setPassword(password);
      return result;
    } catch (error) {
      console.error('Error setting password:', error);
      return { success: false, error: 'Failed to set password' };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const result = await window.electronAPI.changePassword(currentPassword, newPassword);
      return result;
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  async disablePasswordProtection() {
    try {
      const result = await window.electronAPI.disablePasswordProtection();
      return result;
    } catch (error) {
      console.error('Error disabling password protection:', error);
      return { success: false, error: 'Failed to disable password protection' };
    }
  }

  async loadSecuritySettings() {
    try {
      const isEnabled = await this.isPasswordProtectionEnabled();
      this.uiManager.elements.passwordProtectionEnabled.checked = isEnabled;
      
      if (isEnabled) {
        this.uiManager.elements.passwordSettings.style.display = 'none';
        this.uiManager.elements.changePasswordSection.style.display = 'block';
      } else {
        this.uiManager.elements.passwordSettings.style.display = 'none';
        this.uiManager.elements.changePasswordSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }

  async togglePasswordProtection() {
    const isEnabled = this.uiManager.elements.passwordProtectionEnabled.checked;
    
    try {
      const hasPassword = await this.isPasswordProtectionEnabled();
      
      if (isEnabled && !hasPassword) {
        // Show password setup
        this.uiManager.elements.passwordSettings.style.display = 'block';
        this.uiManager.elements.changePasswordSection.style.display = 'none';
      } else if (isEnabled) {
        // Already has password, show change option
        this.uiManager.elements.passwordSettings.style.display = 'none';
        this.uiManager.elements.changePasswordSection.style.display = 'block';
      } else {
        // Trying to disable protection - require password verification
        if (hasPassword) {
          // Reset checkbox and show verification modal
          this.uiManager.elements.passwordProtectionEnabled.checked = true;
          this.showDisableProtectionModal();
        } else {
          // No password set, can disable freely
          this.uiManager.elements.passwordSettings.style.display = 'none';
          this.uiManager.elements.changePasswordSection.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error toggling password protection:', error);
      this.uiManager.showFeedback('password-feedback', 'Error accessing password settings', 'error');
    }
  }

  async saveNewPassword() {
    const newPassword = this.uiManager.elements.newPassword.value;
    const confirmPassword = this.uiManager.elements.confirmPassword.value;
    
    this.uiManager.clearFeedback('password-feedback');
    
    // Enhanced password validation
    const strengthCheck = Utils.validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      this.uiManager.showFeedback('password-feedback', strengthCheck.message, 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.uiManager.showFeedback('password-feedback', 'Passcodes do not match.', 'error');
      return;
    }
    
    try {
      const result = await this.setPassword(newPassword);
      
      if (result.success) {
        this.uiManager.elements.newPassword.value = '';
        this.uiManager.elements.confirmPassword.value = '';
        this.uiManager.elements.passwordSettings.style.display = 'none';
        this.uiManager.elements.changePasswordSection.style.display = 'block';
        
        this.uiManager.showFeedback('password-feedback', 'Passcode saved successfully!', 'success');
        setTimeout(() => this.uiManager.clearFeedback('password-feedback'), 3000);
      } else {
        this.uiManager.showFeedback('password-feedback', result.error || 'Error saving passcode. Please try again.', 'error');
      }
    } catch (error) {
      this.uiManager.showFeedback('password-feedback', 'Error saving passcode. Please try again.', 'error');
    }
  }

  async changeExistingPassword() {
    const currentPassword = this.uiManager.elements.currentPassword.value;
    const newPassword = this.uiManager.elements.newPasswordChange.value;
    const confirmPassword = this.uiManager.elements.confirmPasswordChange.value;
    
    this.uiManager.clearFeedback('change-password-feedback');
    
    if (!currentPassword) {
      this.uiManager.showFeedback('change-password-feedback', 'Please enter your current passcode.', 'error');
      return;
    }
    
    const strengthCheck = Utils.validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      this.uiManager.showFeedback('change-password-feedback', strengthCheck.message, 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.uiManager.showFeedback('change-password-feedback', 'New passcodes do not match.', 'error');
      return;
    }
    
    try {
      const result = await this.changePassword(currentPassword, newPassword);
      
      if (result.success) {
        this.uiManager.elements.currentPassword.value = '';
        this.uiManager.elements.newPasswordChange.value = '';
        this.uiManager.elements.confirmPasswordChange.value = '';
        
        this.uiManager.showFeedback('change-password-feedback', 'Passcode changed successfully!', 'success');
        setTimeout(() => this.uiManager.clearFeedback('change-password-feedback'), 3000);
      } else {
        this.uiManager.showFeedback('change-password-feedback', result.error || 'Error changing passcode. Please try again.', 'error');
      }
    } catch (error) {
      this.uiManager.showFeedback('change-password-feedback', 'Error changing passcode. Please try again.', 'error');
    }
  }

  async showPasswordEntry() {
    this.uiManager.elements.passwordEntryModal.classList.add('active');
    this.uiManager.elements.passwordEntryInput.focus();
    this.uiManager.clearFeedback('password-entry-error');
  }

  async submitPasswordEntry() {
    const password = this.uiManager.elements.passwordEntryInput.value;
    
    if (!password) {
      this.uiManager.showFeedback('password-entry-error', 'Please enter your passcode.', 'error');
      return { success: false };
    }

    // Check for lockout
    if (this.isLockedOut()) {
      const remainingTime = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
      this.uiManager.showFeedback('password-entry-error', `Too many failed attempts. Try again in ${remainingTime} seconds.`, 'error');
      this.uiManager.elements.passwordEntryInput.value = '';
      return { success: false };
    }
    
    const isValid = await this.verifyPasswordWithBruteForceProtection(password);
    
    if (isValid) {
      this.failedPasswordAttempts = 0;
      this.lockoutEndTime = null;
      this.uiManager.elements.passwordEntryModal.classList.remove('active');
      this.uiManager.elements.passwordEntryInput.value = '';
      this.uiManager.clearFeedback('password-entry-error');
      this.startSessionTimeout();
      return { success: true };
    } else {
      this.handleFailedPasswordAttempt();
      this.uiManager.showFeedback('password-entry-error', 'Incorrect passcode. Please try again.', 'error');
      this.uiManager.elements.passwordEntryInput.value = '';
      this.uiManager.elements.passwordEntryInput.focus();
      return { success: false };
    }
  }

  showDisableProtectionModal() {
    this.uiManager.elements.disableProtectionModal.classList.add('active');
    this.uiManager.elements.disableProtectionInput.focus();
    this.uiManager.elements.disableProtectionInput.value = '';
    this.uiManager.clearFeedback('disable-protection-error');
  }

  hideDisableProtectionModal() {
    this.uiManager.elements.disableProtectionModal.classList.remove('active');
    this.uiManager.elements.disableProtectionInput.value = '';
    this.uiManager.clearFeedback('disable-protection-error');
  }

  async confirmDisableProtection() {
    const password = this.uiManager.elements.disableProtectionInput.value;
    
    if (!password) {
      this.uiManager.showFeedback('disable-protection-error', 'Please enter your current passcode.', 'error');
      return false;
    }
    
    // Add delay to prevent rapid attempts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isValid = await this.verifyPassword(password);
    
    if (isValid) {
      // Password correct, disable protection using secure API
      try {
        const result = await this.disablePasswordProtection();
        
        if (result.success) {
          this.uiManager.elements.passwordProtectionEnabled.checked = false;
          this.uiManager.elements.passwordSettings.style.display = 'none';
          this.uiManager.elements.changePasswordSection.style.display = 'none';
          
          // Clear session timeout when protection is disabled
          if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
          }
          
          this.hideDisableProtectionModal();
          return true;
        } else {
          this.uiManager.showFeedback('disable-protection-error', result.error || 'Error disabling protection.', 'error');
          return false;
        }
      } catch (error) {
        this.uiManager.showFeedback('disable-protection-error', 'Error disabling protection. Please try again.', 'error');
        return false;
      }
    } else {
      this.uiManager.showFeedback('disable-protection-error', 'Incorrect passcode. Please try again.', 'error');
      this.uiManager.elements.disableProtectionInput.value = '';
      this.uiManager.elements.disableProtectionInput.focus();
      return false;
    }
  }

  cancelDisableProtection() {
    // Keep protection enabled, just close modal
    this.uiManager.elements.passwordProtectionEnabled.checked = true;
    this.hideDisableProtectionModal();
  }

  // Brute force protection methods
  isLockedOut() {
    return this.lockoutEndTime && Date.now() < this.lockoutEndTime;
  }

  handleFailedPasswordAttempt() {
    this.failedPasswordAttempts++;
    
    if (this.failedPasswordAttempts >= 5) {
      // Lock out for 30 seconds after 5 failed attempts
      this.lockoutEndTime = Date.now() + (30 * 1000);
    } else if (this.failedPasswordAttempts >= 3) {
      // Lock out for 10 seconds after 3 failed attempts
      this.lockoutEndTime = Date.now() + (10 * 1000);
    }
  }

  async verifyPasswordWithBruteForceProtection(password) {
    // Add small delay to prevent rapid attempts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return await this.verifyPassword(password);
  }

  // Session timeout methods
  startSessionTimeout() {
    // Auto-lock after 30 minutes of inactivity
    this.resetSessionTimeout();
    
    // Listen for user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetSessionTimeout(), true);
    });
  }

  async resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Only set timeout if password protection is enabled and user is logged in
    const isEnabled = await this.isPasswordProtectionEnabled();
    if (isEnabled && !this.uiManager.elements.passwordEntryModal.classList.contains('active')) {
      this.sessionTimeout = setTimeout(() => {
        this.lockSession();
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  async lockSession() {
    const isEnabled = await this.isPasswordProtectionEnabled();
    if (isEnabled) {
      return { shouldShowPasswordEntry: true };
    }
    return { shouldShowPasswordEntry: false };
  }

  // Prevent ESC key from closing password modals
  setupSecureModalHandling() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Prevent ESC from closing password entry or disable protection modals
        if (this.uiManager.elements.passwordEntryModal.classList.contains('active') ||
            this.uiManager.elements.disableProtectionModal.classList.contains('active')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }, true);
  }
}

// Make available globally for browser
window.SecurityManager = SecurityManager;