# Documentation Standards and Guidelines

## 📝 Language Policy

**All technical documentation, comments, and code documentation must be written in English.**

### Why English?

1. **International Collaboration**: Enables global collaboration and code sharing
2. **Industry Standard**: Most programming languages, frameworks, and libraries use English
3. **Accessibility**: Makes the codebase accessible to a broader developer community
4. **Professional Standards**: Aligns with professional software development practices
5. **Future Maintenance**: Ensures long-term maintainability regardless of team composition

## 🔤 Documentation Types and Standards

### 1. Code Comments
```javascript
// ✅ CORRECT - English comments
/**
 * Fetches building availability data from LibCal API
 * @param {string} library - Building short name (e.g., 'mug', 'par')
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Availability data with rooms and time slots
 */
async function fetchBuildingAvailability(library, date) {
  // Implementation here
}

// ❌ INCORRECT - Chinese comments
/**
 * 从LibCal API获取建筑可用性数据
 * @param {string} library - 建筑短名称
 * @returns {Promise<Object>} 包含房间和时间段的可用性数据
 */
```

### 2. README Files
- **Project overview** in English
- **Installation instructions** in English
- **Usage examples** in English
- **API documentation** in English

### 3. Technical Documentation
- **Architecture diagrams** with English labels
- **API specifications** in English
- **Database schemas** with English field names
- **Deployment guides** in English

### 4. File Naming Conventions
```
✅ CORRECT - English file names
- API_DOCUMENTATION.md
- USER_GUIDE.md
- DEPLOYMENT_INSTRUCTIONS.md
- TROUBLESHOOTING.md

❌ INCORRECT - Chinese file names
- API文档.md
- 用户指南.md
- 部署说明.md
```

## 📋 Required Documentation Files

Every project/module should include:

1. **README.md** - Project overview and setup instructions
2. **API_DOCUMENTATION.md** - API endpoints and usage
3. **ARCHITECTURE.md** - System architecture overview
4. **DEPLOYMENT.md** - Deployment instructions
5. **TROUBLESHOOTING.md** - Common issues and solutions

## 🎯 Code Documentation Standards

### Function Documentation
```javascript
/**
 * Brief description of what the function does
 * 
 * Longer description if needed, explaining the purpose,
 * algorithm, or important implementation details.
 * 
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Description of optional parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 * 
 * @example
 * // Usage example
 * const result = functionName('example', 123);
 */
```

### Class Documentation
```javascript
/**
 * Brief description of the class purpose
 * 
 * Detailed explanation of the class responsibilities,
 * usage patterns, and important notes.
 * 
 * @class
 * @example
 * // Usage example
 * const instance = new ClassName(options);
 */
class ClassName {
  /**
   * Constructor description
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - API key for authentication
   */
  constructor(options) {
    // Implementation
  }
}
```

## 📚 Markdown Documentation Standards

### Header Structure
```markdown
# Project Title
## Main Sections
### Subsections
#### Detailed Topics
```

### Code Blocks
```markdown
\`\`\`javascript
// Always specify the language for syntax highlighting
const example = 'code example';
\`\`\`
```

### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

### Links and References
```markdown
- [External Link](https://example.com)
- [Internal Reference](./other-file.md)
- [Section Link](#section-header)
```

## 🔍 Review Checklist

Before committing documentation:

- [ ] All text is in English
- [ ] Technical terms are properly explained
- [ ] Code examples are complete and functional
- [ ] Links are working and accessible
- [ ] Grammar and spelling are correct
- [ ] Formatting is consistent
- [ ] Examples are relevant and helpful

## 🛠️ Tools and Resources

### Recommended Tools
- **Grammarly** - Grammar and spell checking
- **Hemingway Editor** - Readability improvement
- **Vale** - Automated prose linting
- **markdownlint** - Markdown formatting

### Style Guides
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Microsoft Writing Style Guide](https://docs.microsoft.com/en-us/style-guide/welcome/)
- [GitLab Documentation Style Guide](https://docs.gitlab.com/ee/development/documentation/styleguide/)

## 🚀 Implementation Timeline

### Phase 1: Immediate (Current Sprint)
- ✅ Convert all existing Chinese documentation to English
- ✅ Update code comments to English
- ✅ Establish documentation standards

### Phase 2: Ongoing
- [ ] Review all new documentation for English compliance
- [ ] Update documentation as features are added
- [ ] Maintain consistency across all files

### Phase 3: Continuous Improvement
- [ ] Regular documentation audits
- [ ] Style guide updates based on team feedback
- [ ] Tool integration for automated checking

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-28  
**Next Review**: 2025-08-28

**Note**: This document serves as the definitive guide for all documentation standards in this project. All team members are expected to follow these guidelines.
