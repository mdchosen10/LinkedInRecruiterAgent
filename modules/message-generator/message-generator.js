/**
 * MessageGenerator - A module for generating personalized recruiting messages
 * 
 * Features:
 * - Template management (create, save, load, delete templates)
 * - Variable substitution for personalization
 * - Support for different message types (interview invite, video request, rejection, etc.)
 * - Natural language processing to ensure messages sound human and personalized
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

class MessageGenerator {
  constructor(options = {}) {
    this.templatesDir = options.templatesDir || path.join(__dirname, 'templates');
    this.defaultTemplatesDir = path.join(__dirname, 'default-templates');
    this.templates = {};
    this.defaultTemplates = {};
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
    
    // Load default templates
    this._loadDefaultTemplates();
    
    // Load custom templates
    this._loadCustomTemplates();
    
    // Register custom Handlebars helpers
    this._registerHandlebarsHelpers();
  }
  
  /**
   * Load default templates from the default templates directory
   * @private
   */
_loadDefaultTemplates() {
  try {
    // Create the default templates directory if it doesn't exist
    if (!fs.existsSync(this.defaultTemplatesDir)) {
      fs.mkdirSync(this.defaultTemplatesDir, { recursive: true });
      
      // Run the default templates creation script
      try {
        require('./default-templates');
        console.log('Created default templates');
      } catch (error) {
        console.error('Error creating default templates:', error);
      }
    }
    
    // Read the default templates directory
    const files = fs.readdirSync(this.defaultTemplatesDir);
    
    // Load each template file
    files.forEach(file => {
      if (file.endsWith('.hbs') || file.endsWith('.html') || file.endsWith('.txt')) {
        const templateName = path.basename(file, path.extname(file));
        const templateContent = fs.readFileSync(path.join(this.defaultTemplatesDir, file), 'utf8');
        
        // Parse template metadata from the first line if it exists (JSON format)
        let metadata = {};
        const lines = templateContent.split('\n');
        if (lines[0].startsWith('{{!--') && lines[0].endsWith('--}}')) {
          try {
            metadata = JSON.parse(lines[0].substring(5, lines[0].length - 4));
            // Remove the metadata line from the template content
            lines.shift();
          } catch (e) {
            console.warn(`Failed to parse metadata for template ${templateName}: ${e.message}`);
          }
        }
        
        this.defaultTemplates[templateName] = {
          content: lines.join('\n'),
          metadata: metadata,
          compiled: Handlebars.compile(lines.join('\n'))
        };
      }
    });
    
    console.log(`Loaded ${Object.keys(this.defaultTemplates).length} default templates`);
  } catch (error) {
    console.error('Error loading default templates:', error);
  }
  }
  
  /**
   * Load custom templates from the templates directory
   * @private
   */
  _loadCustomTemplates() {
    try {
      // Read the templates directory
      if (!fs.existsSync(this.templatesDir)) {
        return;
      }
      
      const files = fs.readdirSync(this.templatesDir);
      
      // Load each template file
      files.forEach(file => {
        if (file.endsWith('.hbs') || file.endsWith('.html') || file.endsWith('.txt')) {
          const templateName = path.basename(file, path.extname(file));
          const templateContent = fs.readFileSync(path.join(this.templatesDir, file), 'utf8');
          
          // Parse template metadata from the first line if it exists (JSON format)
          let metadata = {};
          const lines = templateContent.split('\n');
          if (lines[0].startsWith('{{!--') && lines[0].endsWith('--}}')) {
            try {
              metadata = JSON.parse(lines[0].substring(5, lines[0].length - 4));
              // Remove the metadata line from the template content
              lines.shift();
            } catch (e) {
              console.warn(`Failed to parse metadata for template ${templateName}: ${e.message}`);
            }
          }
          
          this.templates[templateName] = {
            content: lines.join('\n'),
            metadata: metadata,
            compiled: Handlebars.compile(lines.join('\n'))
          };
        }
      });
      
      console.log(`Loaded ${Object.keys(this.templates).length} custom templates`);
    } catch (error) {
      console.error('Error loading custom templates:', error);
    }
  }
  
  /**
   * Register custom Handlebars helpers for advanced template features
   * @private
   */
  _registerHandlebarsHelpers() {
    // Helper to capitalize first letter of each word
    Handlebars.registerHelper('titleCase', function(str) {
      if (!str) return '';
      return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    });
    
    // Helper to format dates
    Handlebars.registerHelper('formatDate', function(date, format) {
      if (!date) return '';
      const dateObj = new Date(date);
      
      // Simple date formatter
      const formats = {
        'MM/DD/YYYY': () => `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`,
        'DD/MM/YYYY': () => `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`,
        'MMMM D, YYYY': () => {
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                         'August', 'September', 'October', 'November', 'December'];
          return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
        },
        'default': () => dateObj.toLocaleDateString()
      };
      
      return (formats[format] || formats['default'])();
    });
    
    // Helper to conditionally include text
    Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
    
    // Helper to choose a random item from a list (for variation)
    Handlebars.registerHelper('random', function(...args) {
      // Remove the last item which is the Handlebars options object
      const options = args.pop();
      const items = args;
      return items[Math.floor(Math.random() * items.length)];
    });
  }
  
  /**
   * Get a list of all available templates (both default and custom)
   * @param {string} [category] - Optional category to filter templates
   * @returns {Object} Object containing template names and metadata
   */
  getAvailableTemplates(category = null) {
    const allTemplates = {};
    
    // Add default templates
    Object.keys(this.defaultTemplates).forEach(name => {
      if (!category || this.defaultTemplates[name].metadata.category === category) {
        allTemplates[name] = {
          ...this.defaultTemplates[name].metadata,
          isDefault: true
        };
      }
    });
    
    // Add custom templates (overriding defaults with the same name)
    Object.keys(this.templates).forEach(name => {
      if (!category || this.templates[name].metadata.category === category) {
        allTemplates[name] = {
          ...this.templates[name].metadata,
          isDefault: false
        };
      }
    });
    
    return allTemplates;
  }
  
  /**
   * Create a new template or update an existing one
   * @param {string} name - Template name
   * @param {string} content - Template content with Handlebars syntax
   * @param {Object} metadata - Template metadata including category, description, etc.
   * @returns {boolean} Success status
   */
  saveTemplate(name, content, metadata = {}) {
    try {
      // Validate the template by trying to compile it
      Handlebars.compile(content);
      
      // Prepare metadata line
      const metadataLine = `{{!--${JSON.stringify(metadata)}--}}\n`;
      
      // Write the template to file
      fs.writeFileSync(
        path.join(this.templatesDir, `${name}.hbs`), 
        metadataLine + content
      );
      
      // Update in-memory template
      this.templates[name] = {
        content,
        metadata,
        compiled: Handlebars.compile(content)
      };
      
      return true;
    } catch (error) {
      console.error(`Error saving template ${name}:`, error);
      return false;
    }
  }
  
  /**
   * Delete a custom template
   * @param {string} name - Template name to delete
   * @returns {boolean} Success status
   */
  deleteTemplate(name) {
    try {
      const templatePath = path.join(this.templatesDir, `${name}.hbs`);
      
      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        console.warn(`Template ${name} does not exist`);
        return false;
      }
      
      // Delete template file
      fs.unlinkSync(templatePath);
      
      // Remove from in-memory templates
      delete this.templates[name];
      
      return true;
    } catch (error) {
      console.error(`Error deleting template ${name}:`, error);
      return false;
    }
  }
  
  /**
   * Generate a message using the specified template and candidate data
   * @param {string} templateName - Name of the template to use
   * @param {Object} candidateData - Data to use for personalization
   * @returns {string|null} Generated message or null if template not found
   */
  generateMessage(templateName, candidateData) {
    // Check if template exists in custom templates first, then default templates
    const template = this.templates[templateName] || this.defaultTemplates[templateName];
    
    if (!template) {
      console.error(`Template ${templateName} not found`);
      return null;
    }
    
    try {
      // Add some context variables for personalization
      const context = {
        ...candidateData,
        currentDate: new Date(),
        // Basic sentiment analysis for personalization
        sentiment: this._analyzeSentiment(candidateData)
      };
      
      // Generate the message using the compiled template
      return template.compiled(context);
    } catch (error) {
      console.error(`Error generating message with template ${templateName}:`, error);
      return null;
    }
  }
  
  /**
   * Generate a message for a specific messaging scenario
   * @param {string} scenario - Scenario type (interview, rejection, etc.)
   * @param {Object} candidateData - Data to use for personalization
   * @returns {string|null} Generated message or null if no suitable template found
   */
  generateMessageForScenario(scenario, candidateData) {
    // Get all templates for the category
    const templates = this.getAvailableTemplates(scenario);
    
    if (Object.keys(templates).length === 0) {
      console.error(`No templates found for scenario ${scenario}`);
      return null;
    }
    
    // Pick the best template based on candidate data
    const templateName = this._selectBestTemplate(templates, candidateData, scenario);
    
    // Generate the message using the selected template
    return this.generateMessage(templateName, candidateData);
  }
  
  /**
   * Select the best template for the candidate based on their data
   * @param {Object} templates - Available templates
   * @param {Object} candidateData - Candidate data
   * @param {string} scenario - Scenario type
   * @returns {string} Best template name
   * @private
   */
  _selectBestTemplate(templates, candidateData, scenario) {
    // This is a simplified selection logic - can be expanded based on needs
    const templateNames = Object.keys(templates);
    
    // If there's only one template for the scenario, use it
    if (templateNames.length === 1) {
      return templateNames[0];
    }
    
    // Check if there's a template specific to the candidate's role
    if (candidateData.role) {
      const roleSpecificTemplate = templateNames.find(name => 
        name.toLowerCase().includes(candidateData.role.toLowerCase())
      );
      
      if (roleSpecificTemplate) {
        return roleSpecificTemplate;
      }
    }
    
    // Check if there's a template specific to the candidate's experience level
    if (candidateData.experienceLevel) {
      const levelSpecificTemplate = templateNames.find(name => 
        name.toLowerCase().includes(candidateData.experienceLevel.toLowerCase())
      );
      
      if (levelSpecificTemplate) {
        return levelSpecificTemplate;
      }
    }
    
    // Default to the first non-default template, or first default if no custom templates
    const customTemplate = templateNames.find(name => !templates[name].isDefault);
    return customTemplate || templateNames[0];
  }
  
  /**
   * Simple sentiment analysis to adjust message tone
   * @param {Object} candidateData - Candidate data
   * @returns {Object} Sentiment analysis results
   * @private
   */
  _analyzeSentiment(candidateData) {
    // This is a placeholder for more advanced sentiment analysis
    // Real implementation could use NLP or machine learning
    
    // Default sentiment
    const sentiment = {
      positive: true,
      enthusiasm: 'medium',
      formality: 'professional'
    };
    
    // Adjust based on candidate data
    if (candidateData.previousInteractions) {
      // If previous interactions were negative, reduce enthusiasm
      const negativeInteractions = candidateData.previousInteractions.filter(
        i => i.type === 'negative' || i.feedback === 'negative'
      );
      
      if (negativeInteractions.length > 0) {
        sentiment.enthusiasm = 'low';
      }
    }
    
    // Adjust formality based on candidate seniority
    if (candidateData.experienceLevel === 'senior' || candidateData.yearsOfExperience > 7) {
      sentiment.formality = 'highly_professional';
    } else if (candidateData.experienceLevel === 'entry' || candidateData.yearsOfExperience < 2) {
      sentiment.formality = 'friendly_professional';
    }
    
    return sentiment;
  }
  
  /**
   * Export a template to a file (for sharing)
   * @param {string} templateName - Name of the template to export
   * @param {string} outputPath - Path to save the exported template
   * @returns {boolean} Success status
   */
  exportTemplate(templateName, outputPath) {
    try {
      const template = this.templates[templateName] || this.defaultTemplates[templateName];
      
      if (!template) {
        console.error(`Template ${templateName} not found`);
        return false;
      }
      
      // Prepare metadata line
      const metadataLine = `{{!--${JSON.stringify(template.metadata)}--}}\n`;
      
      // Write the template to the output file
      fs.writeFileSync(outputPath, metadataLine + template.content);
      
      return true;
    } catch (error) {
      console.error(`Error exporting template ${templateName}:`, error);
      return false;
    }
  }
  
  /**
   * Import a template from a file
   * @param {string} filePath - Path to the template file
   * @param {string} [newName] - New name for the template (optional)
   * @returns {boolean} Success status
   */
  importTemplate(filePath, newName = null) {
    try {
      // Read the template file
      const templateContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse template metadata
      let metadata = {};
      const lines = templateContent.split('\n');
      if (lines[0].startsWith('{{!--') && lines[0].endsWith('--}}')) {
        try {
          metadata = JSON.parse(lines[0].substring(5, lines[0].length - 4));
          // Remove the metadata line from the template content
          lines.shift();
        } catch (e) {
          console.warn(`Failed to parse metadata for imported template: ${e.message}`);
        }
      }
      
      // Determine template name
      const name = newName || path.basename(filePath, path.extname(filePath));
      
      // Save the template
      return this.saveTemplate(name, lines.join('\n'), metadata);
    } catch (error) {
      console.error(`Error importing template:`, error);
      return false;
    }
  }
  
  /**
   * Get template content for editing
   * @param {string} templateName - Name of the template
   * @returns {Object|null} Template object or null if not found
   */
  getTemplateForEditing(templateName) {
    const template = this.templates[templateName] || this.defaultTemplates[templateName];
    
    if (!template) {
      console.error(`Template ${templateName} not found`);
      return null;
    }
    
    return {
      name: templateName,
      content: template.content,
      metadata: template.metadata,
      isDefault: this.defaultTemplates[templateName] ? true : false
    };
  }
}

module.exports = MessageGenerator;