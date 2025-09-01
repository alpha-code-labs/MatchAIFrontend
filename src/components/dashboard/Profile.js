import React, { useState, useEffect, useCallback } from 'react';
import './Profile.css';
import ErrorModal from '../ErrorModal';

const Profile = ({ userProfile, onProfileUpdate }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [profilePictures, setProfilePictures] = useState([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    interestedIn: '',
    city: '',
    lookingFor: '',
    relationshipStatus: '',
    email: '',
    phone: ''
  });
  const [toggles, setToggles] = useState({
    showFullProfile: false,
    showPersonalityScore: false
  });

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  // Define initializePhotos before using it
  const initializePhotos = useCallback(() => {
    const photos = [];
    
    // If user has multiple photos (new format)
    if (userProfile?.profilePictures && Array.isArray(userProfile.profilePictures)) {
      userProfile.profilePictures.forEach(photo => {
        photos.push({
          file: null,
          preview: photo.url,
          isExisting: true,
          isMain: photo.isMain || false
        });
      });
      
      // Find main photo index
      const mainIndex = photos.findIndex(photo => photo.isMain);
      setMainPhotoIndex(mainIndex >= 0 ? mainIndex : 0);
    }
    // If user has single photo from registration (old format)
    else if (userProfile?.profilePicture) {
      photos.push({
        file: null,
        preview: userProfile.profilePicture,
        isExisting: true,
        isMain: true
      });
      setMainPhotoIndex(0);
    }

    // Fill remaining slots with empty slots (up to 5 total)
    while (photos.length < 5) {
      photos.push({
        file: null,
        preview: null,
        isExisting: false,
        isMain: false
      });
    }

    setProfilePictures(photos);
  }, [userProfile]);

  // Initialize photos on component mount
  useEffect(() => {
    initializePhotos();
  }, [initializePhotos]);

  // Sync form data when userProfile prop changes
  useEffect(() => {   
    if (userProfile) {
      const newFormData = {
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        age: userProfile.age || '',
        gender: userProfile.gender || '',
        interestedIn: userProfile.interestedIn || '',
        city: userProfile.city || '',
        lookingFor: userProfile.lookingFor || '',
        relationshipStatus: userProfile.relationshipStatus || '',
        email: userProfile.email || '',
        phone: userProfile.phone || ''
      };

      setFormData(newFormData);
      
      setToggles({
        showFullProfile: userProfile.showFullProfile || false,
        showPersonalityScore: userProfile.showPersonalityScore || false
      });
      
    } 
  }, [userProfile]);

  const handlePhotoChange = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhotos = [...profilePictures];
        newPhotos[index] = {
          file: file,
          preview: e.target.result,
          isExisting: false,
          isMain: index === mainPhotoIndex
        };
        setProfilePictures(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = (index) => {
    const newPhotos = [...profilePictures];
    newPhotos[index] = {
      file: null,
      preview: null,
      isExisting: false,
      isMain: false
    };
    setProfilePictures(newPhotos);

    // If we removed the main photo, set the first available photo as main
    if (index === mainPhotoIndex) {
      const firstPhotoIndex = newPhotos.findIndex(photo => photo.preview);
      setMainPhotoIndex(firstPhotoIndex >= 0 ? firstPhotoIndex : 0);
    }
  };

  const handleSetMainPhoto = (index) => {
    if (profilePictures[index].preview) {
      setMainPhotoIndex(index);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    if (isLocked || !profilePictures[index].preview) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
    
    // Add drag styling
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear drag over if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }    
    const newPhotos = [...profilePictures];
    const draggedPhoto = newPhotos[draggedIndex];
    const targetPhoto = newPhotos[targetIndex];
    
    // Swap photos
    newPhotos[draggedIndex] = targetPhoto;
    newPhotos[targetIndex] = draggedPhoto;
    
    // Update main photo index if needed
    let newMainIndex = mainPhotoIndex;
    if (mainPhotoIndex === draggedIndex) {
      newMainIndex = targetIndex;
    } else if (mainPhotoIndex === targetIndex) {
      newMainIndex = draggedIndex;
    }
    
    setProfilePictures(newPhotos);
    setMainPhotoIndex(newMainIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getPhotosCount = () => {
    return profilePictures.filter(photo => photo.preview).length;
  };

  const getMainPhoto = () => {
    return profilePictures[mainPhotoIndex]?.preview || null;
  };

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (toggleName) => {
    if (isLocked) return;
    
    setToggles(prev => ({
      ...prev,
      [toggleName]: !prev[toggleName]
    }));
  };

  const handleSubmit = async () => {
    // Validate at least one photo
    if (getPhotosCount() === 0) {
      alert('Please upload at least one photo.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Always use FormData for multi-photo upload
      const formDataToSend = new FormData();
      
      // Add form fields with EXACT values from form (no mapping)
      formDataToSend.append('email', formData.email);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('interestedIn', formData.interestedIn);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('lookingFor', formData.lookingFor);
      formDataToSend.append('relationshipStatus', formData.relationshipStatus);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('showFullProfile', toggles.showFullProfile);
      formDataToSend.append('showPersonalityScore', toggles.showPersonalityScore);
      
      // Add main photo index
      formDataToSend.append('mainPhotoIndex', mainPhotoIndex);
      
      // Add new photos with their positions
      profilePictures.forEach((photo, index) => {
        if (photo.file) {
          formDataToSend.append(`profilePicture_${index}`, photo.file);
        }
      });
      
      // Add existing photos info
      const existingPhotos = profilePictures
        .map((photo, index) => ({
          index,
          url: photo.isExisting ? photo.preview : null,
          isMain: index === mainPhotoIndex
        }))
        .filter(photo => photo.url);
      
      formDataToSend.append('existingPhotos', JSON.stringify(existingPhotos));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local state with server response
      const updatedUser = result.data.user;
      // Update form data with fresh server data (use exact values)
      setFormData({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        age: updatedUser.age || '',
        gender: updatedUser.gender || '',
        interestedIn: updatedUser.interestedIn || '',
        city: updatedUser.city || '',
        lookingFor: updatedUser.lookingFor || '',
        relationshipStatus: updatedUser.relationshipStatus || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || ''
      });
      
      // Update toggles with fresh server data
      setToggles({
        showFullProfile: updatedUser.showFullProfile || false,
        showPersonalityScore: updatedUser.showPersonalityScore || false
      });
      
      // Reinitialize photos with server data
      initializePhotos();
      
      // Lock the form after successful update
      setIsLocked(true);
      
      // Notify parent components about the update
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      } else {
        console.error('❌ Profile: onProfileUpdate callback not provided');
      }

    } catch (error) {
      console.error('❌ Profile update failed:', error);
      setShowServerError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  // Loading Screen
  if (isSubmitting) {
    return (
      <div className="profile-loading-overlay">
        <div className="profile-loading-container">
          <div className="profile-loading-content">
            <div className="profile-loading-icon">💾</div>
            <h2 className="profile-loading-title">Updating Your Profile</h2>
            <p className="profile-loading-message">
              We're saving your changes and uploading your photos. This will only take a moment!
            </p>
            <div className="profile-loading-progress">
              <div className="profile-progress-bar">
                <div className="profile-progress-fill"></div>
              </div>
              <div className="profile-progress-steps">
                <div className="profile-progress-step active">
                  <div className="profile-step-icon">📝</div>
                  <span>Saving Changes</span>
                </div>
                <div className="profile-progress-step active">
                  <div className="profile-step-icon">📸</div>
                  <span>Uploading Photos</span>
                </div>
                <div className="profile-progress-step">
                  <div className="profile-step-icon">✅</div>
                  <span>Complete</span>
                </div>
              </div>
            </div>
            <div className="profile-loading-spinner">
              <div className="profile-spinner-ring"></div>
              <div className="profile-spinner-ring"></div>
              <div className="profile-spinner-ring"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-section">
      {/* Header with Lock/Unlock */}
      <div className="profile-header">
        <h2 className="profile-title">Profile</h2>
        <button 
          className={`lock-button ${isLocked ? 'locked' : 'unlocked'}`}
          onClick={handleLockToggle}
          title={isLocked ? 'Click to edit profile' : 'Click to lock profile'}
        >
          {isLocked ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18Z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Profile Pictures Section */}
      <div className="profile-pictures-section">
        <div className="pictures-header">
          <h3 className="section-title">
            <span className="section-icon">📸</span>
            Profile Photos
          </h3>
          <div className="photos-info">
            <span className="photos-count">{getPhotosCount()}/5 photos</span>
            <span className="photos-hint">Upload up to 5 photos for better matches</span>
          </div>
        </div>

        {/* Main Profile Picture Display */}
        <div className="main-photo-section">
          <div className="main-photo-container">
            {getMainPhoto() ? (
              <img 
                src={getMainPhoto()} 
                alt="Main Profile" 
                className="main-profile-picture" 
              />
            ) : (
              <div className="main-profile-placeholder">
                {getInitials(formData.firstName, formData.lastName)}
              </div>
            )}
            <div className="main-photo-badge">Main Photo</div>
          </div>
        </div>

        {/* Photo Gallery with Drag & Drop */}
        <div className="photo-gallery">
          {profilePictures.map((photo, index) => (
            <div 
              key={index} 
              className={`photo-slot ${photo.preview ? 'filled' : 'empty'} ${index === mainPhotoIndex ? 'main' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              {photo.preview ? (
                <>
                  <img 
                    src={photo.preview} 
                    alt={`Profile ${index + 1}`} 
                    className="gallery-photo"
                    draggable={!isLocked}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                  />
                  
                  {!isLocked && (
                    <div className="photo-controls">
                      <button
                        className={`set-main-btn ${index === mainPhotoIndex ? 'active' : ''}`}
                        onClick={() => handleSetMainPhoto(index)}
                        title="Set as main photo"
                      >
                        {index === mainPhotoIndex ? '⭐' : '☆'}
                      </button>
                      <button
                        className="remove-photo-btn"
                        onClick={() => handlePhotoRemove(index)}
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  {index === mainPhotoIndex && (
                    <div className="main-indicator">Main</div>
                  )}
                  
                  {!isLocked && (
                    <div className="drag-handle" title="Drag to reorder">
                      <span className="drag-icon">⋮⋮</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!isLocked && (
                    <>
                      <input
                        type="file"
                        id={`photo-input-${index}`}
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(index, e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor={`photo-input-${index}`}
                        className="add-photo-button"
                      >
                        <div className="add-photo-icon">+</div>
                        <div className="add-photo-text">Add Photo</div>
                      </label>
                    </>
                  )}
                  
                  {isLocked && (
                    <div className="empty-slot-message">
                      <div className="empty-icon">📷</div>
                      <div className="empty-text">Empty Slot</div>
                    </div>
                  )}
                  
                  {dragOverIndex === index && (
                    <div className="drop-indicator">
                      <div className="drop-icon">📷</div>
                      <div className="drop-text">Drop Photo Here</div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="photos-guidelines">
          <h4 className="guidelines-title">Photo Guidelines:</h4>
          <ul className="guidelines-list">
            <li>✅ Upload up to 5 high-quality photos</li>
            <li>⭐ Select your best photo as your main profile picture</li>
            <li>🔄 <strong>Drag photos between slots to reorder them</strong></li>
            <li>🎯 Include a mix of close-up and full-body shots</li>
            <li>😊 Show your personality and interests</li>
            <li>📅 Use recent photos (within 2 years)</li>
          </ul>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="profile-form-section">
        <h3 className="section-title">Personal Information</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Interested In</label>
            <select
              name="interestedIn"
              value={formData.interestedIn}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            >
              <option value="">Select Interest</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="everyone">Everyone</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Looking For</label>
            <select
              name="lookingFor"
              value={formData.lookingFor}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            >
              <option value="">Select what you're looking for</option>
              <option value="long-term">Long-term relationship</option>
              <option value="friendship">Friendship</option>
              <option value="both">Both (Friendship & Dating)</option>
              <option value="casual">Casual dating</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Relationship Status</label>
            <select
              name="relationshipStatus"
              value={formData.relationshipStatus}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="relationship">In a relationship</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
              <option value="complicated">It's complicated</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isLocked}
              className={`form-input ${isLocked ? 'locked' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings Section */}
      <div className="privacy-settings-section">
        <h3 className="section-title">Privacy Settings</h3>
        
        {/* Full Profile Toggle */}
        <div className="toggle-group">
          <div className="toggle-header">
            <span className="toggle-title">Show your full profile to potential matches</span>
            <button 
              className={`toggle-switch ${toggles.showFullProfile ? 'active' : ''} ${isLocked ? 'disabled' : ''}`}
              onClick={() => handleToggleChange('showFullProfile')}
              disabled={isLocked}
            >
              <div className="toggle-slider"></div>
            </button>
          </div>
          <p className="toggle-description">
            Select yes if you want to show your full profile to potential suitors. Select No if you want to show only Name, and Profile Pic.
          </p>
        </div>

        {/* Personality Score Toggle */}
        <div className="toggle-group">
          <div className="toggle-header">
            <span className="toggle-title">Show your personality score and profile to potential suitors</span>
            <button 
              className={`toggle-switch ${toggles.showPersonalityScore ? 'active' : ''} ${isLocked ? 'disabled' : ''}`}
              onClick={() => handleToggleChange('showPersonalityScore')}
              disabled={isLocked}
            >
              <div className="toggle-slider"></div>
            </button>
          </div>
          <p className="toggle-description">
            Select yes if you want to show your personality profile and score to potential suitors or no if you don't want to display.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      {!isLocked && (
        <div className="submit-section">
          <button className="submit-button" onClick={handleSubmit}>
            <span className="button-icon">💾</span>
            Save Changes
          </button>
        </div>
      )}

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default Profile;