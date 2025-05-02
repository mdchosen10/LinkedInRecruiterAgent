/**
 * Default templates for recruiting messages
 * 
 * This file creates the default templates to be used by the MessageGenerator module.
 * Templates are stored as .hbs files with metadata in the first line as a JSON comment.
 */

const fs = require('fs');
const path = require('path');

// Directory for default templates
const defaultTemplatesDir = path.join(__dirname, 'default-templates');

// Create directory if it doesn't exist
if (!fs.existsSync(defaultTemplatesDir)) {
  fs.mkdirSync(defaultTemplatesDir, { recursive: true });
}

// Define default templates
const defaultTemplates = {
  // Interview invitation templates
  'interview_invitation_standard': {
    content: `{{!--{"category":"interview","description":"Standard interview invitation","variables":["candidateName","position","companyName","interviewDate","interviewTime","interviewerName"]}--}}
Hi {{candidateName}},

Thank you for your interest in the {{position}} role at {{companyName}}. We've reviewed your application and would like to invite you for an interview.

{{#if interviewDate}}
We'd like to schedule the interview for {{formatDate interviewDate "MMMM D, YYYY"}} at {{interviewTime}}. 
{{else}}
We'd like to schedule an interview at your earliest convenience.
{{/if}}

{{#if interviewerName}}
You'll be speaking with {{interviewerName}}, who is looking forward to learning more about your experience and background.
{{/if}}

Please let me know if this time works for you, or if you need to suggest an alternative.

Looking forward to your response!

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'interview_invitation_standard.hbs')
  },

  'interview_invitation_technical': {
    content: `{{!--{"category":"interview","description":"Technical interview invitation with details about the format","variables":["candidateName","position","companyName","interviewDate","interviewTime","interviewerName","technicalFocus"]}--}}
Hi {{candidateName}},

I hope this message finds you well! We've been impressed with your background in {{#if candidateSkills}}{{random candidateSkills}}{{else}}your field{{/if}} and would like to invite you to a technical interview for the {{position}} position at {{companyName}}.

{{#if interviewDate}}
The interview is scheduled for {{formatDate interviewDate "MMMM D, YYYY"}} at {{interviewTime}}. 
{{else}}
We'd like to schedule this technical interview at a time that works best for you.
{{/if}}

{{#if technicalFocus}}
This interview will focus primarily on {{technicalFocus}}. You might want to refresh your knowledge in this area before the interview.
{{else}}
This will be a technical interview where we'll discuss your expertise and approach to solving problems relevant to the role.
{{/if}}

{{#if interviewerName}}
You'll be speaking with {{interviewerName}}, our {{interviewerRole}}.
{{/if}}

{{#ifCond sentiment.enthusiasm "==" "high"}}
We're particularly excited about your experience with {{#if candidateSkills}}{{candidateSkills.[0]}}{{else}}relevant technologies{{/if}} and looking forward to discussing how you could contribute to our team!
{{/ifCond}}

Could you please confirm if this time works for you? If not, please suggest a few alternatives.

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'interview_invitation_technical.hbs')
  },

  'interview_invitation_senior': {
    content: `{{!--{"category":"interview","description":"Senior-level candidate interview invitation","variables":["candidateName","position","companyName","interviewDate","interviewTime","interviewerName"]}--}}
Hello {{titleCase candidateName}},

I'm reaching out regarding your application for the {{position}} role at {{companyName}}. Your extensive experience, particularly in {{#if candidateSkills}}{{candidateSkills.[0]}} and {{candidateSkills.[1]}}{{else}}your field{{/if}}, has caught our attention.

{{#if interviewDate}}
We would like to arrange an interview with you on {{formatDate interviewDate "MMMM D, YYYY"}} at {{interviewTime}}. 
{{else}}
We would like to arrange an interview with you at your earliest convenience.
{{/if}}

{{#if interviewerName}}
You'll be meeting with {{interviewerName}}, our {{interviewerRole}}. The discussion will focus on your leadership experience and strategic vision, alongside technical aspects of the role.
{{else}}
The interview will involve several members of our leadership team. The discussion will focus on your leadership experience and strategic vision, alongside technical aspects of the role.
{{/if}}

This conversation will give us a chance to share more about our company's direction and how your expertise could help shape our future.

Please let me know if the proposed time is convenient for you, or if you'd prefer an alternative arrangement.

Regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'interview_invitation_senior.hbs')
  },

  // Video request templates
  'video_interview_request': {
    content: `{{!--{"category":"video","description":"Request for candidate to complete video interview","variables":["candidateName","position","companyName","deadline","videoPlatform"]}--}}
Hi {{candidateName}},

Thank you for applying to the {{position}} position at {{companyName}}. As the next step in our process, we'd like to invite you to complete a short video interview.

{{#if videoPlatform}}
This interview will be conducted through {{videoPlatform}}. You'll receive a separate email with a link to access the platform and detailed instructions.
{{else}}
You'll receive a separate email with a link to access our video interview platform and detailed instructions.
{{/if}}

The video interview consists of {{videoQuestionCount}} questions and should take approximately {{videoDurationMinutes}} minutes to complete. You'll have the opportunity to re-record your answers before submitting.

{{#if deadline}}
Please complete this video interview by {{formatDate deadline "MMMM D, YYYY"}}.
{{else}}
Please complete this video interview within the next 5 business days.
{{/if}}

This format allows us to get to know you better while providing flexibility for you to complete it at your convenience.

If you have any questions or require any accommodations, please don't hesitate to reach out.

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'video_interview_request.hbs')
  },

  // Rejection templates
  'rejection_standard': {
    content: `{{!--{"category":"reject","description":"Standard rejection message","variables":["candidateName","position","companyName"]}--}}
Hello {{candidateName}},

Thank you for your interest in the {{position}} position at {{companyName}} and for taking the time to apply.

After careful consideration of your qualifications and experience, we've decided to move forward with other candidates whose backgrounds more closely align with our current needs for this specific role.

We appreciate your interest in joining our team and encourage you to apply for future positions that match your skills and experience.

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'rejection_standard.hbs')
  },

  'rejection_after_interview': {
    content: `{{!--{"category":"reject","description":"Rejection after interview with feedback","variables":["candidateName","position","companyName","feedback"]}--}}
Hello {{candidateName}},

Thank you for taking the time to interview for the {{position}} position at {{companyName}}. We appreciate your interest in joining our team and the effort you put into the interview process.

After careful consideration, we've decided to move forward with another candidate whose experience more closely aligns with our current team needs. This was a difficult decision, as we were impressed with many aspects of your background.

{{#if feedback}}
I wanted to share some feedback from your interview: {{feedback}}
{{/if}}

We would be happy to keep your resume on file and consider you for future opportunities that might be a better match. Please don't hesitate to apply again if you see another position that interests you.

We wish you all the best in your job search and future career endeavors.

Regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'rejection_after_interview.hbs')
  },

  // Offer templates
  'offer_announcement': {
    content: `{{!--{"category":"offer","description":"Job offer announcement","variables":["candidateName","position","companyName","startDate","salary"]}--}}
Dear {{titleCase candidateName}},

I'm delighted to inform you that {{companyName}} would like to offer you the position of {{position}}!

Based on your impressive background and our conversations during the interview process, we believe you would be an excellent addition to our team. Your experience in {{#if candidateSkills}}{{candidateSkills.[0]}}{{else}}your field{{/if}} aligns perfectly with what we're looking for in this role.

{{#if offerDetails}}
Here's a summary of the offer:
- Position: {{position}}
- Salary: {{salary}}
- Start date: {{#if startDate}}{{formatDate startDate "MMMM D, YYYY"}}{{else}}To be determined{{/if}}
- Benefits: {{offerDetails.benefits}}
{{else}}
A formal offer letter with complete details regarding compensation, benefits, and start date will follow shortly.
{{/if}}

We're excited about the potential of having you join our team and contribute to our mission to {{companyMission}}.

Please let me know if you have any questions about the offer or need any additional information to help with your decision.

We look forward to your response!

Warm regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'offer_announcement.hbs')
  },

  // Follow-up templates
  'follow_up_after_interview': {
    content: `{{!--{"category":"follow_up","description":"Follow-up after interview","variables":["candidateName","position","companyName","interviewDate"]}--}}
Hi {{candidateName}},

I hope you're doing well! I wanted to thank you for taking the time to interview for the {{position}} role {{#if interviewDate}}on {{formatDate interviewDate "MMMM D, YYYY"}}{{/if}}.

Our team was impressed with {{#if candidateSkills}}your expertise in {{candidateSkills.[0]}}{{else}}your background and experience{{/if}}. We're still in the process of interviewing candidates and expect to make a decision within the next {{decisionTimeframe}}.

If you have any additional questions about the role or our company that came up after the interview, please don't hesitate to reach out.

Thanks again for your interest in {{companyName}}, and we'll be in touch soon with an update.

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'follow_up_after_interview.hbs')
  },

  'application_received': {
    content: `{{!--{"category":"general","description":"Confirmation that application was received","variables":["candidateName","position","companyName"]}--}}
Hello {{candidateName}},

Thank you for applying to the {{position}} position at {{companyName}}. This email confirms that we've received your application and it is currently under review by our hiring team.

The review process typically takes {{reviewTimeframe}} to complete. We'll contact you if your qualifications match our needs for this role.

In the meantime, feel free to visit our website to learn more about {{companyName}} and our culture.

We appreciate your interest in joining our team!

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
    filePath: path.join(defaultTemplatesDir, 'application_received.hbs')
  }
};

// Write default templates to files
Object.keys(defaultTemplates).forEach(templateName => {
  const template = defaultTemplates[templateName];
  fs.writeFileSync(template.filePath, template.content);
  console.log(`Created default template: ${templateName}`);
});

console.log('All default templates created successfully!');