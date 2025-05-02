/**
 * Tests for the MessageGenerator class
 */

const MessageGenerator = require('../MessageGenerator');
const fs = require('fs');
const path = require('path');

// Test directory paths
const TEST_TEMPLATES_DIR = path.join(__dirname, 'test_templates');
const TEST_DEFAULT_TEMPLATES_DIR = path.join(__dirname, 'test_default_templates');

// Setup and teardown helpers
beforeAll(() => {
  // Create test directories
  if (!fs.existsSync(TEST_TEMPLATES_DIR)) {
    fs.mkdirSync(TEST_TEMPLATES_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(TEST_DEFAULT_TEMPLATES_DIR)) {
    fs.mkdirSync(TEST_DEFAULT_TEMPLATES_DIR, { recursive: true });
  }
  
  // Create a test default template
  const defaultTemplate = `{{!--{"category":"test","description":"Test Template","variables":["name","position"]}--}}
Hello {{name}},

This is a test template for the {{position}} position.

Regards,
Test Recruiter`;

  fs.writeFileSync(
    path.join(TEST_DEFAULT_TEMPLATES_DIR, 'test_template.hbs'),
    defaultTemplate
  );
});

afterAll(() => {
  // Clean up test directories
  if (fs.existsSync(TEST_TEMPLATES_DIR)) {
    fs.rmSync(TEST_TEMPLATES_DIR, { recursive: true, force: true });
  }
  
  if (fs.existsSync(TEST_DEFAULT_TEMPLATES_DIR)) {
    fs.rmSync(TEST_DEFAULT_TEMPLATES_DIR, { recursive: true, force: true });
  }
});

describe('MessageGenerator', () => {
  let messageGenerator;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    messageGenerator = new MessageGenerator({
      templatesDir: TEST_TEMPLATES_DIR,
      defaultTemplatesDir: TEST_DEFAULT_TEMPLATES_DIR
    });
  });
  
  test('should initialize with the correct directories', () => {
    expect(messageGenerator.templatesDir).toBe(TEST_TEMPLATES_DIR);
    expect(messageGenerator.defaultTemplatesDir).toBe(TEST_DEFAULT_TEMPLATES_DIR);
  });
  
  test('should load default templates correctly', () => {
    expect(Object.keys(messageGenerator.defaultTemplates)).toContain('test_template');
    expect(messageGenerator.defaultTemplates.test_template.metadata.category).toBe('test');
  });
  
  test('should save and load custom templates', () => {
    // Create a custom template
    const templateName = 'custom_template';
    const templateContent = 'Hello {{name}}, this is a custom template.';
    const templateMetadata = { category: 'custom', description: 'Custom Test Template' };
    
    const saveResult = messageGenerator.saveTemplate(templateName, templateContent, templateMetadata);
    expect(saveResult).toBe(true);
    
    // Check that the template was saved to disk
    const templatePath = path.join(TEST_TEMPLATES_DIR, `${templateName}.hbs`);
    expect(fs.existsSync(templatePath)).toBe(true);
    
    // Check that the template is in memory
    expect(Object.keys(messageGenerator.templates)).toContain(templateName);
    expect(messageGenerator.templates[templateName].metadata.category).toBe('custom');
    
    // Reload the templates and check again
    const newMessageGenerator = new MessageGenerator({
      templatesDir: TEST_TEMPLATES_DIR,
      defaultTemplatesDir: TEST_DEFAULT_TEMPLATES_DIR
    });
    
    expect(Object.keys(newMessageGenerator.templates)).toContain(templateName);
  });
  
  test('should generate messages with template variables', () => {
    const candidateData = {
      name: 'John Doe',
      position: 'Software Engineer'
    };
    
    const message = messageGenerator.generateMessage('test_template', candidateData);
    expect(message).toContain('Hello John Doe');
    expect(message).toContain('Software Engineer position');
  });
  
  test('should return null when template not found', () => {
    const candidateData = {
      name: 'John Doe',
      position: 'Software Engineer'
    };
    
    const message = messageGenerator.generateMessage('non_existent_template', candidateData);
    expect(message).toBeNull();
  });
  
  test('should delete custom templates', () => {
    // First create a template
    const templateName = 'template_to_delete';
    const templateContent = 'This template will be deleted.';
    
    messageGenerator.saveTemplate(templateName, templateContent, { category: 'test' });
    
    // Verify it exists
    expect(Object.keys(messageGenerator.templates)).toContain(templateName);
    
    // Delete it
    const deleteResult = messageGenerator.deleteTemplate(templateName);
    expect(deleteResult).toBe(true);
    
    // Verify it's gone
    expect(Object.keys(messageGenerator.templates)).not.toContain(templateName);
    
    // Check file is gone
    const templatePath = path.join(TEST_TEMPLATES_DIR, `${templateName}.hbs`);
    expect(fs.existsSync(templatePath)).toBe(false);
  });
  
  test('should handle Handlebars helpers', () => {
    // Create a template with helpers
    const templateName = 'helper_test';
    const templateContent = `
Hello {{titleCase name}},
Today is {{formatDate currentDate "MMMM D, YYYY"}}.
{{#ifCond position "===" "Senior Developer"}}
You're applying for a senior position.
{{else}}
You're applying for a position.
{{/ifCond}}
`;
    
    messageGenerator.saveTemplate(templateName, templateContent, { category: 'test' });
    
    // Test with different data
    const seniorData = {
      name: 'john smith',
      currentDate: '2025-05-01',
      position: 'Senior Developer'
    };
    
    const juniorData = {
      name: 'jane doe',
      currentDate: '2025-05-01',
      position: 'Junior Developer'
    };
    
    const seniorMessage = messageGenerator.generateMessage(templateName, seniorData);
    expect(seniorMessage).toContain('Hello John Smith');
    expect(seniorMessage).toContain('Today is May 1, 2025');
    expect(seniorMessage).toContain('You\'re applying for a senior position');
    
    const juniorMessage = messageGenerator.generateMessage(templateName, juniorData);
    expect(juniorMessage).toContain('Hello Jane Doe');
    expect(juniorMessage).toContain('Today is May 1, 2025');
    expect(juniorMessage).toContain('You\'re applying for a position');
  });
  
  test('should select best template based on candidate data', () => {
    // Create multiple templates for the same scenario
    messageGenerator.saveTemplate(
      'interview_generic',
      'Generic interview template',
      { category: 'interview' }
    );
    
    messageGenerator.saveTemplate(
      'interview_developer',
      'Developer interview template',
      { category: 'interview' }
    );
    
    messageGenerator.saveTemplate(
      'interview_senior',
      'Senior position interview template',
      { category: 'interview' }
    );
    
    // Test with different candidate data
    const developer = {
      name: 'John Developer',
      role: 'developer',
      experienceLevel: 'mid'
    };
    
    const seniorDesigner = {
      name: 'Jane Designer',
      role: 'designer',
      experienceLevel: 'senior'
    };
    
    // The _selectBestTemplate method is private, so we test it through generateMessageForScenario
    const mockGenerator = {
      generateMessage: jest.fn().mockReturnValue('Mock message')
    };
    
    // Save the original method
    const originalGenerateMessage = messageGenerator.generateMessage;
    
    // Mock the generateMessage method to check which template is selected
    messageGenerator.generateMessage = mockGenerator.generateMessage;
    
    messageGenerator.generateMessageForScenario('interview', developer);
    expect(mockGenerator.generateMessage).toHaveBeenCalledWith('interview_developer', developer);
    
    mockGenerator.generateMessage.mockClear();
    
    messageGenerator.generateMessageForScenario('interview', seniorDesigner);
    expect(mockGenerator.generateMessage).toHaveBeenCalledWith('interview_senior', seniorDesigner);
    
    // Restore the original method
    messageGenerator.generateMessage = originalGenerateMessage;
  });
  
  test('should import and export templates', () => {
    // Create a template to export
    const templateName = 'export_test';
    const templateContent = 'Template for export testing.';
    const templateMetadata = { 
      category: 'test', 
      description: 'Export Test Template' 
    };
    
    messageGenerator.saveTemplate(templateName, templateContent, templateMetadata);
    
    // Export the template
    const exportPath = path.join(TEST_TEMPLATES_DIR, 'exported_template.hbs');
    const exportResult = messageGenerator.exportTemplate(templateName, exportPath);
    expect(exportResult).toBe(true);
    expect(fs.existsSync(exportPath)).toBe(true);
    
    // Import the template with a new name
    const importName = 'imported_template';
    const importResult = messageGenerator.importTemplate(exportPath, importName);
    expect(importResult).toBe(true);
    
    // Check that the imported template exists
    expect(Object.keys(messageGenerator.templates)).toContain(importName);
    expect(messageGenerator.templates[importName].metadata.category).toBe('test');
  });
});