// Sample data for development and demo purposes

// Sample candidates data
export const getSampleCandidates = async () => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: '1',
      name: 'Alex Johnson',
      title: 'Senior Software Engineer',
      company: 'Tech Innovations Inc.',
      location: 'San Francisco, CA',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      score: 92,
      status: 'contacted',
      skills: ['JavaScript', 'React', 'Node.js', 'AWS', 'TypeScript'],
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'Tech Innovations Inc.',
          duration: 'Jan 2020 - Present',
          description: 'Lead developer for cloud-based SaaS products. Implemented CI/CD pipelines and microservices architecture.'
        },
        {
          title: 'Software Engineer',
          company: 'DataSys Solutions',
          duration: 'Mar 2017 - Dec 2019',
          description: 'Developed full-stack web applications using React and Node.js. Improved system performance by 40%.'
        },
        {
          title: 'Junior Developer',
          company: 'WebStart Agency',
          duration: 'Jun 2015 - Feb 2017',
          description: 'Built responsive websites and implemented analytics integrations for clients.'
        }
      ],
      education: [
        {
          degree: 'M.S. Computer Science',
          school: 'Stanford University',
          year: '2015'
        },
        {
          degree: 'B.S. Computer Science',
          school: 'University of California, Berkeley',
          year: '2013'
        }
      ],
      notes: 'Excellent candidate with strong technical skills. Has experience leading teams and implementing complex systems.',
      lastContact: '2023-11-05',
      evaluations: {
        technicalSkills: 95,
        communication: 88,
        leadership: 90,
        cultureFit: 94
      }
    },
    {
      id: '2',
      name: 'Samantha Lee',
      title: 'UX/UI Designer',
      company: 'Creative Design Studio',
      location: 'New York, NY',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      score: 88,
      status: 'screening',
      skills: ['UI Design', 'Figma', 'User Research', 'Prototyping', 'Adobe XD'],
      experience: [
        {
          title: 'UX/UI Designer',
          company: 'Creative Design Studio',
          duration: 'Jun 2019 - Present',
          description: 'Lead designer for mobile and web applications. Conducted user research and usability testing.'
        },
        {
          title: 'UI Designer',
          company: 'Digital Products Inc.',
          duration: 'Sep 2017 - May 2019',
          description: 'Created wireframes and visual designs for SaaS products. Collaborated with engineering teams.'
        },
        {
          title: 'Graphic Designer',
          company: 'Marketing Solutions',
          duration: 'Mar 2015 - Aug 2017',
          description: 'Designed marketing materials and brand identities for clients across various industries.'
        }
      ],
      education: [
        {
          degree: 'B.F.A. Graphic Design',
          school: 'Rhode Island School of Design',
          year: '2015'
        }
      ],
      notes: 'Strong portfolio with excellent understanding of user-centered design principles.',
      lastContact: '2023-11-10',
      evaluations: {
        designSkills: 92,
        communication: 85,
        teamwork: 88,
        cultureFit: 86
      }
    },
    {
      id: '3',
      name: 'Michael Chen',
      title: 'Data Scientist',
      company: 'Analytics Insights',
      location: 'Boston, MA',
      photo: 'https://randomuser.me/api/portraits/men/67.jpg',
      score: 95,
      status: 'interviewing',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Data Visualization'],
      experience: [
        {
          title: 'Data Scientist',
          company: 'Analytics Insights',
          duration: 'Aug 2018 - Present',
          description: 'Developed predictive models for customer behavior analysis. Implemented NLP solutions for text classification.'
        },
        {
          title: 'Data Analyst',
          company: 'Finance Tech Solutions',
          duration: 'Oct 2016 - Jul 2018',
          description: 'Analyzed transaction data to identify trends and anomalies. Created dashboards for executives.'
        },
        {
          title: 'Research Assistant',
          company: 'MIT Media Lab',
          duration: 'Sep 2014 - Sep 2016',
          description: 'Assisted in research projects focused on machine learning applications in healthcare.'
        }
      ],
      education: [
        {
          degree: 'M.S. Data Science',
          school: 'Massachusetts Institute of Technology',
          year: '2016'
        },
        {
          degree: 'B.S. Statistics',
          school: 'Carnegie Mellon University',
          year: '2014'
        }
      ],
      notes: 'Exceptional candidate with strong analytical skills and research background.',
      lastContact: '2023-11-12',
      evaluations: {
        technicalSkills: 96,
        analyticalThinking: 97,
        communication: 90,
        cultureFit: 92
      }
    },
    {
      id: '4',
      name: 'Emily Rodriguez',
      title: 'Product Manager',
      company: 'ProductSphere',
      location: 'Austin, TX',
      photo: 'https://randomuser.me/api/portraits/women/33.jpg',
      score: 86,
      status: 'new',
      skills: ['Product Strategy', 'Agile', 'Market Research', 'User Stories', 'Roadmapping'],
      experience: [
        {
          title: 'Product Manager',
          company: 'ProductSphere',
          duration: 'Feb 2020 - Present',
          description: 'Led cross-functional teams to deliver SaaS products. Defined product roadmap and prioritized features.'
        },
        {
          title: 'Associate Product Manager',
          company: 'Tech Solutions Group',
          duration: 'Apr 2018 - Jan 2020',
          description: 'Assisted in product development lifecycle. Gathered user requirements and coordinated with engineering teams.'
        },
        {
          title: 'Business Analyst',
          company: 'ConsultTech Services',
          duration: 'Jul 2016 - Mar 2018',
          description: 'Analyzed business processes and recommended improvements. Created documentation for system requirements.'
        }
      ],
      education: [
        {
          degree: 'MBA',
          school: 'University of Texas at Austin',
          year: '2016'
        },
        {
          degree: 'B.A. Business Administration',
          school: 'University of California, Los Angeles',
          year: '2014'
        }
      ],
      notes: 'Results-oriented product manager with experience in B2B SaaS products.',
      lastContact: null,
      evaluations: {
        productStrategy: 87,
        leadership: 85,
        communication: 88,
        techKnowledge: 82
      }
    },
    {
      id: '5',
      name: 'David Kim',
      title: 'DevOps Engineer',
      company: 'CloudTech Systems',
      location: 'Seattle, WA',
      photo: 'https://randomuser.me/api/portraits/men/22.jpg',
      score: 90,
      status: 'screening',
      skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
      experience: [
        {
          title: 'DevOps Engineer',
          company: 'CloudTech Systems',
          duration: 'Nov 2019 - Present',
          description: 'Implemented infrastructure as code using Terraform. Managed Kubernetes clusters across multiple environments.'
        },
        {
          title: 'Systems Administrator',
          company: 'ServerOps Inc.',
          duration: 'May 2017 - Oct 2019',
          description: 'Maintained Linux server infrastructure. Implemented monitoring solutions and automated deployments.'
        },
        {
          title: 'IT Support Specialist',
          company: 'Tech Solutions Corp',
          duration: 'Aug 2015 - Apr 2017',
          description: 'Provided technical support for internal systems. Implemented security policies and procedures.'
        }
      ],
      education: [
        {
          degree: 'B.S. Computer Science',
          school: 'University of Washington',
          year: '2015'
        }
      ],
      notes: 'Strong technical background with excellent problem-solving skills.',
      lastContact: '2023-11-08',
      evaluations: {
        technicalSkills: 92,
        problemSolving: 90,
        communication: 85,
        teamwork: 88
      }
    },
    {
      id: '6',
      name: 'Sarah Williams',
      title: 'Frontend Developer',
      company: 'WebUI Technologies',
      location: 'Denver, CO',
      photo: 'https://randomuser.me/api/portraits/women/65.jpg',
      score: 84,
      status: 'contacted',
      skills: ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript', 'Responsive Design'],
      experience: [
        {
          title: 'Frontend Developer',
          company: 'WebUI Technologies',
          duration: 'Jul 2020 - Present',
          description: 'Developed responsive web applications using React. Implemented state management with Redux.'
        },
        {
          title: 'Web Developer',
          company: 'Digital Agency Co.',
          duration: 'Mar 2018 - Jun 2020',
          description: 'Built interactive websites for clients. Focused on responsive design and cross-browser compatibility.'
        },
        {
          title: 'Junior Frontend Developer',
          company: 'Startup Ventures',
          duration: 'Sep 2016 - Feb 2018',
          description: 'Assisted in frontend development tasks. Created UI components and implemented design mockups.'
        }
      ],
      education: [
        {
          degree: 'B.S. Web Development',
          school: 'Colorado State University',
          year: '2016'
        }
      ],
      notes: 'Creative developer with strong attention to detail and UI/UX sensibilities.',
      lastContact: '2023-11-07',
      evaluations: {
        technicalSkills: 86,
        creativity: 90,
        communication: 82,
        teamwork: 85
      }
    }
  ];
};

// Sample evaluation criteria
export const getSampleEvaluationCriteria = async () => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: 'technicalSkills',
      name: 'Technical Skills',
      description: 'Assessment of relevant technical abilities and knowledge',
      weight: 30,
    },
    {
      id: 'communication',
      name: 'Communication',
      description: 'Ability to articulate ideas and communicate effectively',
      weight: 20,
    },
    {
      id: 'leadership',
      name: 'Leadership',
      description: 'Demonstrated leadership qualities and potential',
      weight: 15,
    },
    {
      id: 'problemSolving',
      name: 'Problem Solving',
      description: 'Analytical thinking and problem-solving approach',
      weight: 20,
    },
    {
      id: 'cultureFit',
      name: 'Culture Fit',
      description: 'Alignment with company values and team dynamics',
      weight: 15,
    }
  ];
};

// Sample message templates
export const getSampleMessageTemplates = async () => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return [
    {
      id: 'initialOutreach',
      name: 'Initial Outreach',
      subject: 'Opportunity at {{company_name}}',
      body: `Hi {{candidate_name}},

I hope this message finds you well. I'm {{recruiter_name}} from {{company_name}}, and I came across your profile which caught my attention.

Given your experience with {{candidate_skill}}, I think you might be a great fit for our {{job_title}} role. We're looking for someone with your background to join our growing team.

Would you be interested in learning more about this opportunity? If so, I'd love to schedule a brief call to discuss further.

Looking forward to hearing from you!

Best regards,
{{recruiter_name}}
{{company_name}}
{{recruiter_contact}}`
    },
    {
      id: 'followUp',
      name: 'Follow-up After No Response',
      subject: 'Following up on my previous message',
      body: `Hi {{candidate_name}},

I wanted to follow up on my previous message about the {{job_title}} role at {{company_name}}. I understand you're likely busy, but I wanted to reiterate our interest in your profile.

If you're open to a conversation, I'd be happy to provide more details about the role and our company.

Looking forward to connecting!

Best regards,
{{recruiter_name}}
{{company_name}}
{{recruiter_contact}}`
    },
    {
      id: 'interviewInvitation',
      name: 'Interview Invitation',
      subject: 'Interview Invitation - {{job_title}} at {{company_name}}',
      body: `Hi {{candidate_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}. After reviewing your profile, we would like to invite you for an interview.

Could you please let me know your availability for a {{interview_duration}} interview in the coming week? We're flexible and can accommodate your schedule.

During the interview, you'll have the opportunity to speak with {{interviewer_name}}, our {{interviewer_title}}. We'll discuss your experience, the role in detail, and answer any questions you might have.

Please confirm your interest and preferred time slots, and I'll schedule the interview accordingly.

Looking forward to your response!

Best regards,
{{recruiter_name}}
{{company_name}}
{{recruiter_contact}}`
    }
  ];
};