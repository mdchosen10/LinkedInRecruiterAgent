import React from 'react';

const MessageTemplateSelector = ({ templates, selectedTemplate, onTemplateChange, loading }) => {
  // Handle template selection
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      onTemplateChange(template);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-linkedin-blue"></div>
      </div>
    );
  }
  
  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No templates available</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <label htmlFor="template-select" className="block text-sm font-medium text-gray-700">
          Select Template
        </label>
        <select
          id="template-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-linkedin-blue focus:border-linkedin-blue sm:text-sm rounded-md"
          value={selectedTemplate?.id || ''}
          onChange={handleTemplateChange}
        >
          <option value="" disabled>
            Select a template
          </option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedTemplate && (
        <div>
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Template Details
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Name:</span> {selectedTemplate.name}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Subject:</span> {selectedTemplate.subject}
            </p>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              className="text-sm text-linkedin-blue hover:text-linkedin-dark-blue font-medium"
            >
              Create New Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTemplateSelector;