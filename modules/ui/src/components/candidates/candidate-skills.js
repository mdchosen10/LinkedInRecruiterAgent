import React from 'react';

const CandidateSkills = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No skills information available</p>
      </div>
    );
  }

  // Group skills by category (if available)
  const hasCategories = skills.some(skill => typeof skill === 'object' && skill.category);
  
  if (hasCategories) {
    // Group skills by category
    const groupedSkills = skills.reduce((groups, skill) => {
      const category = skill.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(skill);
      return groups;
    }, {});
    
    return (
      <div className="space-y-6">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {typeof skill === 'object' ? skill.name : skill}
                  {typeof skill === 'object' && skill.level && (
                    <span className="ml-1 text-gray-500">({skill.level})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Simple list of skills
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <span 
          key={index}
          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
        >
          {typeof skill === 'object' ? skill.name : skill}
        </span>
      ))}
    </div>
  );
};

export default CandidateSkills;