import React, { useState, useEffect } from 'react';
import './BuildBio.css';
import ErrorModal from '../ErrorModal';

const BuildBio = ({ userProfile, updateUserProfile }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [bioData, setBioData] = useState({
    personalBio: '',
    height: '',
    education: '',
    occupation: '',
    company: '',
    interests: '', // Store as string initially
    hobbies: '', // Store as string initially
    musicGenres: '', // Store as string initially
    movieGenres: '', // Store as string initially
    fitnessLevel: '',
    smokingHabits: '',
    drinkingHabits: '',
    dietPreference: '',
    relationshipType: '',
    familyPlans: '',
    religiousViews: '',
    politicalViews: '',
    languages: '' // Store as string initially
  });

  useEffect(() => {
    if (userProfile && userProfile.bioData) {
      // Convert arrays back to comma-separated strings for display
      const bioDataForForm = { ...userProfile.bioData };
      
      // Convert arrays to strings for form inputs
      if (Array.isArray(bioDataForForm.interests)) {
        bioDataForForm.interests = bioDataForForm.interests.join(', ');
      }
      if (Array.isArray(bioDataForForm.hobbies)) {
        bioDataForForm.hobbies = bioDataForForm.hobbies.join(', ');
      }
      if (Array.isArray(bioDataForForm.musicGenres)) {
        bioDataForForm.musicGenres = bioDataForForm.musicGenres.join(', ');
      }
      if (Array.isArray(bioDataForForm.movieGenres)) {
        bioDataForForm.movieGenres = bioDataForForm.movieGenres.join(', ');
      }
      if (Array.isArray(bioDataForForm.languages)) {
        bioDataForForm.languages = bioDataForForm.languages.join(', ');
      }
      
      setBioData(bioDataForForm);
      // Keep it locked if bio data exists (like Profile page behavior)
      setIsLocked(true);
    }
  }, [userProfile]);

  const handleInputChange = (field, value) => {
    setBioData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field, value) => {
    // Store the raw input value, don't process it until form submission
    setBioData(prev => ({
      ...prev,
      [field]: value // Store as string, convert to array later
    }));
  };

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Since BuildBio doesn't have an onClose prop, just close the modal
    // The user stays on the current page
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert string fields back to arrays before submitting
      const bioDataToSubmit = { ...bioData };
      
      // Convert comma-separated strings to arrays
      bioDataToSubmit.interests = bioData.interests.split(',').map(item => item.trim()).filter(item => item);
      bioDataToSubmit.hobbies = bioData.hobbies.split(',').map(item => item.trim()).filter(item => item);
      bioDataToSubmit.musicGenres = bioData.musicGenres.split(',').map(item => item.trim()).filter(item => item);
      bioDataToSubmit.movieGenres = bioData.movieGenres.split(',').map(item => item.trim()).filter(item => item);
      bioDataToSubmit.languages = bioData.languages.split(',').map(item => item.trim()).filter(item => item);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/update-bio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userProfile.email,
          bioData: bioDataToSubmit
        })
      });

      if (response.ok) {
        
        updateUserProfile({
          ...userProfile,
          bioData: bioDataToSubmit
        });

        // Auto-lock after successful save (same as Profile page)
        setIsLocked(true);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving bio data:', error);
      setShowServerError(true);
    } finally {
      setLoading(false);
    }
  };

  const unlockSection = () => {
    setIsLocked(false);
  };

  if (isLocked) {
    // Show different messages based on whether bio data exists
    const hasBioData = userProfile && userProfile.bioData && Object.keys(userProfile.bioData).some(key => {
      const value = userProfile.bioData[key];
      return value && (typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.length > 0 : true);
    });

    return (
      <div className="build-bio-section">
        <div className="locked-section" onClick={unlockSection}>
          <div className="lock-icon">🔒</div>
          <h2>Build Your Bio</h2>
          {hasBioData ? (
            <>
              <p>Your bio is complete and saved</p>
              <div className="unlock-hint">Click to unlock and edit your bio</div>
            </>
          ) : (
            <>
              <p>Complete your profile to attract better matches</p>
              <div className="unlock-hint">Click to unlock and complete your bio</div>
            </>
          )}
        </div>
        <ErrorModal 
          isOpen={showServerError} 
          onOkClick={handleErrorOkClick}
        />
      </div>
    );
  }

  return (
    <div className="build-bio-section">
      <div className="bio-header">
        <h2 className="bio-title">Build Your Bio</h2>
        <div className="bio-subtitle">
          <span className="completion-tip">💡 Complete your bio for better matches!</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bio-form">
        {/* About You Section */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">✍️</span>
              About You
            </h3>
          </div>
          
          <div className="form-group">
            <label htmlFor="personalBio">Personal Bio</label>
            <textarea
              id="personalBio"
              value={bioData.personalBio}
              onChange={(e) => handleInputChange('personalBio', e.target.value)}
              placeholder="Tell us about yourself... What makes you unique?"
              rows="4"
              maxLength="500"
            />
            <div className="char-count">{bioData.personalBio.length}/500</div>
          </div>

          <div className="form-group">
            <label htmlFor="height">Height</label>
            <select
              id="height"
              value={bioData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
            >
              <option value="">Select your height</option>
              <option value="4-10">4 ft 10 in</option>
              <option value="4-11">4 ft 11 in</option>
              <option value="5-0">5 ft 0 in</option>
              <option value="5-1">5 ft 1 in</option>
              <option value="5-2">5 ft 2 in</option>
              <option value="5-3">5 ft 3 in</option>
              <option value="5-4">5 ft 4 in</option>
              <option value="5-5">5 ft 5 in</option>
              <option value="5-6">5 ft 6 in</option>
              <option value="5-7">5 ft 7 in</option>
              <option value="5-8">5 ft 8 in</option>
              <option value="5-9">5 ft 9 in</option>
              <option value="5-10">5 ft 10 in</option>
              <option value="5-11">5 ft 11 in</option>
              <option value="6-0">6 ft 0 in</option>
              <option value="6-1">6 ft 1 in</option>
              <option value="6-2">6 ft 2 in</option>
              <option value="6-3">6 ft 3 in</option>
              <option value="6-4">6 ft 4 in</option>
              <option value="6-5">6 ft 5 in</option>
              <option value="6-6">6 ft 6 in</option>
            </select>
          </div>
        </div>

        {/* Career & Education */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">🎓</span>
              Career & Education
            </h3>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="education">Education</label>
              <select
                id="education"
                value={bioData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
              >
                <option value="">Select education level</option>
                <option value="High School">High School</option>
                <option value="Some College">Some College</option>
                <option value="Bachelors Degree">Bachelors Degree</option>
                <option value="Masters Degree">Masters Degree</option>
                <option value="PhD">PhD</option>
                <option value="Professional Degree">Professional Degree</option>
                <option value="Trade School">Trade School</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <input
                type="text"
                id="occupation"
                value={bioData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Your job title"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              value={bioData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Where do you work?"
            />
          </div>
        </div>

        {/* Interests & Hobbies */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">🎨</span>
              Interests & Hobbies
            </h3>
          </div>
          
          <div className="form-group">
            <label htmlFor="interests">Interests</label>
            <input
              type="text"
              id="interests"
              value={bioData.interests}
              onChange={(e) => handleArrayInputChange('interests', e.target.value)}
              placeholder="Technology, Travel, Photography (separate with commas)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="hobbies">Hobbies</label>
            <input
              type="text"
              id="hobbies"
              value={bioData.hobbies}
              onChange={(e) => handleArrayInputChange('hobbies', e.target.value)}
              placeholder="Reading, Hiking, Gaming (separate with commas)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="musicGenres">Music Genres</label>
              <input
                type="text"
                id="musicGenres"
                value={bioData.musicGenres}
                onChange={(e) => handleArrayInputChange('musicGenres', e.target.value)}
                placeholder="Pop, Rock, Classical (separate with commas)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="movieGenres">Movie Genres</label>
              <input
                type="text"
                id="movieGenres"
                value={bioData.movieGenres}
                onChange={(e) => handleArrayInputChange('movieGenres', e.target.value)}
                placeholder="Comedy, Drama, Action (separate with commas)"
              />
            </div>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">🏃‍♂️</span>
              Lifestyle
            </h3>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fitnessLevel">Fitness Level</label>
              <select
                id="fitnessLevel"
                value={bioData.fitnessLevel}
                onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
              >
                <option value="">Select fitness level</option>
                <option value="Very Active">Very Active</option>
                <option value="Active">Active</option>
                <option value="Moderately Active">Moderately Active</option>
                <option value="Lightly Active">Lightly Active</option>
                <option value="Sedentary">Sedentary</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="smokingHabits">Smoking</label>
              <select
                id="smokingHabits"
                value={bioData.smokingHabits}
                onChange={(e) => handleInputChange('smokingHabits', e.target.value)}
              >
                <option value="">Select smoking habits</option>
                <option value="Never">Never</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Socially">Socially</option>
                <option value="Regularly">Regularly</option>
                <option value="Trying to Quit">Trying to Quit</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="drinkingHabits">Drinking</label>
              <select
                id="drinkingHabits"
                value={bioData.drinkingHabits}
                onChange={(e) => handleInputChange('drinkingHabits', e.target.value)}
              >
                <option value="">Select drinking habits</option>
                <option value="Never">Never</option>
                <option value="Rarely">Rarely</option>
                <option value="Socially">Socially</option>
                <option value="Regularly">Regularly</option>
                <option value="Frequently">Frequently</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dietPreference">Diet</label>
              <select
                id="dietPreference"
                value={bioData.dietPreference}
                onChange={(e) => handleInputChange('dietPreference', e.target.value)}
              >
                <option value="">Select diet preference</option>
                <option value="Everything">Everything</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Pescatarian">Pescatarian</option>
                <option value="Keto">Keto</option>
                <option value="Paleo">Paleo</option>
                <option value="Gluten-Free">Gluten-Free</option>
              </select>
            </div>
          </div>
        </div>

        {/* Relationship Goals */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">💕</span>
              Relationship Goals
            </h3>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="relationshipType">Looking For</label>
              <select
                id="relationshipType"
                value={bioData.relationshipType}
                onChange={(e) => handleInputChange('relationshipType', e.target.value)}
              >
                <option value="">What are you looking for?</option>
                <option value="Casual Dating">Casual Dating</option>
                <option value="Serious Relationship">Serious Relationship</option>
                <option value="Marriage">Marriage</option>
                <option value="Friendship">Friendship</option>
                <option value="Not Sure Yet">Not Sure Yet</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="familyPlans">Family Plans</label>
              <select
                id="familyPlans"
                value={bioData.familyPlans}
                onChange={(e) => handleInputChange('familyPlans', e.target.value)}
              >
                <option value="">Select family plans</option>
                <option value="Want Kids">Want Kids</option>
                <option value="Maybe Kids">Maybe Kids</option>
                <option value="No Kids">No Kids</option>
                <option value="Have Kids">Have Kids</option>
                <option value="Not Sure">Not Sure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Values & Beliefs */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">🙏</span>
              Values & Beliefs
            </h3>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="religiousViews">Religious Views</label>
              <select
                id="religiousViews"
                value={bioData.religiousViews}
                onChange={(e) => handleInputChange('religiousViews', e.target.value)}
              >
                <option value="">Select religious views</option>
                <option value="Very Religious">Very Religious</option>
                <option value="Religious">Religious</option>
                <option value="Spiritual">Spiritual</option>
                <option value="Agnostic">Agnostic</option>
                <option value="Atheist">Atheist</option>
                <option value="Prefer Not to Say">Prefer Not to Say</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="politicalViews">Political Views</label>
              <select
                id="politicalViews"
                value={bioData.politicalViews}
                onChange={(e) => handleInputChange('politicalViews', e.target.value)}
              >
                <option value="">Select political views</option>
                <option value="Very Liberal">Very Liberal</option>
                <option value="Liberal">Liberal</option>
                <option value="Moderate">Moderate</option>
                <option value="Conservative">Conservative</option>
                <option value="Very Conservative">Very Conservative</option>
                <option value="Not Political">Not Political</option>
                <option value="Prefer Not to Say">Prefer Not to Say</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="languages">Languages</label>
            <input
              type="text"
              id="languages"
              value={bioData.languages}
              onChange={(e) => handleArrayInputChange('languages', e.target.value)}
              placeholder="English, Spanish, French (separate with commas)"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="save-bio-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Saving Your Bio...
              </>
            ) : (
              'Save Bio'
            )}
          </button>
        </div>
      </form>

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default BuildBio;