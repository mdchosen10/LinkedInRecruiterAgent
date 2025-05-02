import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { getSampleMessageTemplates } from '../services/sampleData';

// Components
import MessageComposer from '../components/messaging/MessageComposer';
import MessageTemplateSelector from '../components/messaging/MessageTemplateSelector';
import CandidateSelector from '../components/messaging/CandidateSelector';
import MessagePreview from '../components/messaging/MessagePreview';

// Icons
import { PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const MessagingPage = () => {
  const { filteredCandidates, selectedCandidate, setSelectedCandidate } = useData();
  
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [templateVariables, setTemplateVariables] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Load message templates
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templates = await getSampleMessageTemplates();
        setMessageTemplates(templates);
        
        // Set default template
        if (templates.length > 0) {
          setSelectedTemplate(templates[0]);
          setMessageSubject(templates[0].subject);
          setMessageBody(templates[0].body);
        }
      } catch (error) {
        console.error('Error loading message templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  // Update variables when candidate or template changes
  useEffect(() => {
    const variables = {};
    
    if (selectedCandidate) {
      variables.candidate_name = selectedCandidate.name;
      variables.candidate_skill = selectedCandidate.skills[0] || '';
    }
    
    // Add default recruiter variables
    variables.recruiter_name = 'John Recruiter';
    variables.company_name = 'Your Company';
    variables.job_title = 'Software Engineer';
    variables.recruiter_contact = 'john@yourcompany.com';
    variables.interview_duration = '30-minute';
    variables.interviewer_name = 'Jane Manager';
    variables.interviewer_title = 'Engineering Manager';
    
    setTemplateVariables(variables);
  }, [selectedCandidate, selectedTemplate]);
  
  // Handle template selection
  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    setMessageSubject(template.subject);
    setMessageBody(template.body);
  };
  
  // Handle candidate selection
  const handleCandidateChange = (candidate) => {
    setSelectedCandidate(candidate);
  };
  
  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedCandidate) {
      alert('Please select a candidate');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success state
      setSentSuccess(true);
      
      // Reset after delay
      setTimeout(() => {
        setSentSuccess(false);
        
        // Clear form or prepare for next message
        if (messageTemplates.length > 0) {
          setSelectedTemplate(messageTemplates[0]);
          setMessageSubject(messageTemplates[0].subject);
          setMessageBody(messageTemplates[0].body);
        } else {
          setMessageSubject('');
          setMessageBody('');
        }
        
        setSelectedCandidate(null);
        setShowPreview(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle preview toggle
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  // Replace template variables in text
  const replaceTemplateVariables = (text) => {
    if (!text) return '';
    
    let result = text;
    
    // Replace all variables
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value || `[${key}]`);
    });
    
    return result;
  };
  
  // Process subject and body with variables
  const processedSubject = replaceTemplateVariables(messageSubject);
  const processedBody = replaceTemplateVariables(messageBody);
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Messaging</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and send messages to candidates
        </p>
      </div>
      
      {/* Success message */}
      {sentSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Message sent successfully!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - options */}
        <div className="space-y-6">
          {/* Candidate selector */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Candidate</h2>
            <CandidateSelector 
              candidates={filteredCandidates}
              selectedCandidate={selectedCandidate}
              onCandidateChange={handleCandidateChange}
            />
          </div>
          
          {/* Template selector */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Message Template</h2>
            <MessageTemplateSelector 
              templates={messageTemplates}
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
              loading={loadingTemplates}
            />
          </div>
        </div>
        
        {/* Right column - composer/preview */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${!showPreview 
                      ? 'border-linkedin-blue text-linkedin-blue' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  Compose
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${showPreview 
                      ? 'border-linkedin-blue text-linkedin-blue' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  Preview
                </button>
              </nav>
            </div>
            
            {/* Content */}
            <div className="pt-4">
              {showPreview ? (
                <MessagePreview 
                  subject={processedSubject}
                  body={processedBody}
                  candidate={selectedCandidate}
                />
              ) : (
                <MessageComposer 
                  subject={messageSubject}
                  body={messageBody}
                  onSubjectChange={setMessageSubject}
                  onBodyChange={setMessageBody}
                  templateVariables={templateVariables}
                />
              )}
              
              {/* Actions */}
              <div className="mt-6 flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
                >
                  {showPreview ? 'Edit Message' : 'Preview Message'}
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isSending || !selectedCandidate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;