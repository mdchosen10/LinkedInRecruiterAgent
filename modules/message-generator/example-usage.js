/**
 * Example usage of the MessageGenerator module
 * 
 * This file demonstrates how to use the MessageGenerator module
 * for various recruiting scenarios.
 */

const MessageGenerator = require('./MessageGenerator');

// Create an instance of the message generator
const messageGenerator = new MessageGenerator({
  templatesDir: './custom_templates' // Custom templates directory
});

// Example 1: Generate a standard interview invitation
console.log('\n--- Example 1: Standard Interview Invitation ---');
const candidateData1 = {
  candidateName: 'John Smith',
  position: 'Senior Software Engineer',
  companyName: 'TechInnovate',
  interviewDate: '2025-05-20',
  interviewTime: '2:00 PM EST',
  interviewerName: 'Sarah Johnson',
  interviewerRole: 'Engineering Manager',
  recruiterName: 'Michael Rodriguez',
  candidateSkills: ['JavaScript', 'React', 'Node.js', 'AWS']
};

const message1 = messageGenerator.generateMessage('interview_invitation_standard', candidateData1);
console.log(message1);

// Example 2: Generate a technical interview invitation
console.log('\n--- Example 2: Technical Interview Invitation ---');
const candidateData2 = {
  candidateName: 'Emily Chen',
  position: 'Frontend Developer',
  companyName: 'TechInnovate',
  interviewDate: '2025-05-22',
  interviewTime: '11:00 AM EST',
  interviewerName: 'David Lee',
  interviewerRole: 'Senior Frontend Engineer',
  technicalFocus: 'React component architecture and state management',
  recruiterName: 'Michael Rodriguez',
  candidateSkills: ['React', 'TypeScript', 'CSS', 'GraphQL']
};

const message2 = messageGenerator.generateMessage('interview_invitation_technical', candidateData2);
console.log(message2);

// Example 3: Generate a rejection message
console.log('\n--- Example 3: Rejection After Interview ---');
const candidateData3 = {
  candidateName: 'Robert Johnson',
  position: 'Product Manager',
  companyName: 'TechInnovate',
  recruiterName: 'Michael Rodriguez',
  feedback: 'While your technical skills are strong, we were looking for someone with more experience leading cross-functional teams. We were impressed with your product vision and would encourage you to apply for future roles that might be a better match.'
};

const message3 = messageGenerator.generateMessage('rejection_after_interview', candidateData3);
console.log(message3);

// Example 4: Generate a video interview request
console.log('\n--- Example 4: Video Interview Request ---');
const candidateData4 = {
  candidateName: 'Jessica Williams',
  position: 'UX Designer',
  companyName: 'TechInnovate',
  deadline: '2025-05-30',
  videoPlatform: 'HireView',
  videoQuestionCount: 5,
  videoDurationMinutes: 15,
  recruiterName: 'Michael Rodriguez'
};

const message4 = messageGenerator.generateMessage('video_interview_request', candidateData4);
console.log(message4);

// Example 5: Generate an offer announcement
console.log('\n--- Example 5: Offer Announcement ---');
const candidateData5 = {
  candidateName: 'alex martinez',
  position: 'Senior Data Scientist',
  companyName: 'TechInnovate',
  startDate: '2025-06-15',
  offerDetails: {
    salary: '$130,000 per year',
    benefits: 'Health insurance, 401(k) with 4% match, unlimited PTO, and remote work options'
  },
  companyMission: 'revolutionize data-driven decision making for enterprises',
  recruiterName: 'Michael Rodriguez',
  candidateSkills: ['Python', 'Machine Learning', 'Statistical Analysis', 'Data Visualization']
};

const message5 = messageGenerator.generateMessage('offer_announcement', candidateData5);
console.log(message5);

// Example 6: Generate a message based on scenario rather than specific template
console.log('\n--- Example 6: Scenario-Based Message (Interview) ---');
const candidateData6 = {
  candidateName: 'Maria Garcia',
  position: 'DevOps Engineer',
  companyName: 'TechInnovate',
  interviewDate: '2025-05-25',
  interviewTime: '3:30 PM EST',
  interviewerName: 'James Wilson',
  interviewerRole: 'Head of Infrastructure',
  recruiterName: 'Michael Rodriguez',
  experienceLevel: 'senior',
  yearsOfExperience: 8,
  candidateSkills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform']
};

const message6 = messageGenerator.generateMessageForScenario('interview', candidateData6);
console.log(message6);

// Example 7: Create and use a custom template
console.log('\n--- Example 7: Custom Template Creation and Usage ---');

// Create a custom template
const customTemplateName = 'custom_follow_up_coding_challenge';
const customTemplateContent = `Hi {{candidateName}},

Thank you for your interest in the {{position}} role at {{companyName}}. We'd like to move forward with a coding challenge to better assess your skills in {{#if candidateSkills}}{{candidateSkills.[0]}} and {{candidateSkills.[1]}}{{else}}our technical stack{{/if}}.

The challenge details have been sent to your email. You'll have {{challengeDuration}} to complete it, with a deadline of {{formatDate challengeDeadline "MMMM D, YYYY"}}.

This challenge is designed to evaluate your problem-solving skills and coding style in a real-world scenario. We're particularly interested in seeing how you approach {{challengeFocus}}.

If you have any questions or need clarification about the challenge, please don't hesitate to reach out.

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`;

const customTemplateMetadata = {
  category: 'technical_assessment',
  description: 'Follow-up with coding challenge details',
  variables: ['candidateName', 'position', 'companyName', 'challengeDuration', 'challengeDeadline', 'challengeFocus']
};

// Save the custom template
messageGenerator.saveTemplate(
  customTemplateName,
  customTemplateContent,
  customTemplateMetadata
);

// Use the custom template
const candidateData7 = {
  candidateName: 'Thomas Anderson',
  position: 'Backend Engineer',
  companyName: 'TechInnovate',
  challengeDuration: '48 hours',
  challengeDeadline: '2025-05-20',
  challengeFocus: 'API design and error handling',
  recruiterName: 'Michael Rodriguez',
  candidateSkills: ['Python', 'Django', 'REST APIs', 'SQL']
};

const message7 = messageGenerator.generateMessage(customTemplateName, candidateData7);
console.log(message7);

// Example 8: List all available templates by category
console.log('\n--- Example 8: List Available Templates by Category ---');
const interviewTemplates = messageGenerator.getAvailableTemplates('interview');
console.log('Interview Templates:');
console.log(interviewTemplates);

// Example 9: Export a template for sharing
console.log('\n--- Example 9: Export Template ---');
messageGenerator.exportTemplate('interview_invitation_technical', './exported_technical_interview_template.hbs');
console.log('Template exported to ./exported_technical_interview_template.hbs');

// Example 10: Delete a custom template
console.log('\n--- Example 10: Delete Custom Template ---');
messageGenerator.deleteTemplate(customTemplateName);
console.log(`Deleted custom template: ${customTemplateName}`);

// Integration example with a candidate profile system
console.log('\n--- Integration Example: Candidate Profile System ---');

// Mock candidate profile retrieval function
function getCandidateProfile(candidateId) {
  // In a real system, this would query a database
  const profiles = {
    '12345': {
      candidateName: 'Samuel Lee',
      email: 'samuel.lee@example.com',
      position: 'Full Stack Developer',
      companyName: 'TechInnovate',
      experienceLevel: 'mid',
      yearsOfExperience: 5,
      candidateSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      applicationDate: '2025-04-15',
      status: 'interview_scheduled',
      interviewDate: '2025-05-28',
      interviewTime: '10:00 AM EST',
      interviewerName: 'Jennifer Kim',
      interviewerRole: 'Tech Lead',
      previousInteractions: [
        { type: 'application', date: '2025-04-15', feedback: 'positive' },
        { type: 'phone_screen', date: '2025-04-22', feedback: 'positive' }
      ]
    }
  };
  
  return profiles[candidateId];
}

// Mock function to handle message sending
function sendMessage(email, subject, messageBody) {
  console.log(`\nSending email to: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${messageBody}`);
  // In a real system, this would use an email service
  return true;
}

// Simulate a workflow where a candidate is progressing to a technical interview
function processCandidate(candidateId, messageType) {
  // Get candidate data
  const candidateProfile = getCandidateProfile(candidateId);
  
  if (!candidateProfile) {
    console.error(`Candidate with ID ${candidateId} not found`);
    return false;
  }
  
  // Add recruiter information
  candidateProfile.recruiterName = 'Michael Rodriguez';
  
  // Generate appropriate message based on status and type
  let messageBody;
  let subject;
  
  switch (messageType) {
    case 'interview_invitation':
      messageBody = messageGenerator.generateMessageForScenario('interview', candidateProfile);
      subject = `Interview Invitation: ${candidateProfile.position} at ${candidateProfile.companyName}`;
      break;
    case 'follow_up':
      messageBody = messageGenerator.generateMessage('follow_up_after_interview', candidateProfile);
      subject = `Following Up on Your Interview with ${candidateProfile.companyName}`;
      break;
    default:
      console.error(`Unknown message type: ${messageType}`);
      return false;
  }
  
  // Send the message
  return sendMessage(candidateProfile.email, subject, messageBody);
}

// Process a candidate
processCandidate('12345', 'interview_invitation');