import { SkillCategory } from '../config/programs';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  points: number;
}

export interface SkillTest {
  category: SkillCategory;
  title: string;
  duration: number; // in minutes
  passingScore: number;
  questions: Question[];
}

export const skillTests: Record<SkillCategory, SkillTest> = {
  [SkillCategory.SolanaDeveloper]: {
    category: SkillCategory.SolanaDeveloper,
    title: 'Solana Developer Certification',
    duration: 90,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: 'What is a Program Derived Address (PDA) in Solana?',
        options: [
          'A regular wallet address',
          'An address derived deterministically from a program ID and seeds',
          'A temporary account that expires',
          'A multi-signature wallet'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 2,
        question: 'What is the main purpose of Anchor framework?',
        options: [
          'To deploy Solana validators',
          'To simplify Solana program development with abstractions',
          'To create NFTs',
          'To manage wallet connections'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 3,
        question: 'Which language are Solana programs primarily written in?',
        options: [
          'JavaScript',
          'Python',
          'Rust',
          'C++'
        ],
        correctAnswer: 2,
        points: 10
      },
      {
        id: 4,
        question: 'What is the maximum size of a single transaction in Solana?',
        options: [
          '512 bytes',
          '1232 bytes',
          '2048 bytes',
          'No limit'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 5,
        question: 'What is rent in Solana?',
        options: [
          'Transaction fees paid to validators',
          'Cost to maintain data storage on-chain',
          'Payment for priority transactions',
          'Token staking rewards'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 6,
        question: 'What does SPL stand for?',
        options: [
          'Solana Public Library',
          'Solana Program Language',
          'Solana Program Library',
          'Smart Program Logic'
        ],
        correctAnswer: 2,
        points: 10
      },
      {
        id: 7,
        question: 'How many signatures can a Solana transaction have?',
        options: [
          'Only 1',
          'Up to 12',
          'Up to 64',
          'Unlimited'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 8,
        question: 'What is the purpose of the #[account] attribute in Anchor?',
        options: [
          'To define account validation and deserialization',
          'To create a new token',
          'To sign transactions',
          'To deploy programs'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 9,
        question: 'What happens to an account with insufficient rent balance?',
        options: [
          'It remains active indefinitely',
          'It gets deallocated and data is lost',
          'It automatically gets funded',
          'It becomes read-only'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 10,
        question: 'What is the Solana runtime called?',
        options: [
          'Sealevel',
          'Anchor',
          'Web3.js',
          'Metaplex'
        ],
        correctAnswer: 0,
        points: 10
      }
    ]
  },
  [SkillCategory.UIUXDesigner]: {
    category: SkillCategory.UIUXDesigner,
    title: 'UI/UX Designer Certification',
    duration: 120,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: 'What does UX stand for?',
        options: [
          'User Experience',
          'Universal Extension',
          'Unified Exchange',
          'User Execution'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 2,
        question: 'Which tool is most commonly used for UI/UX design prototyping?',
        options: [
          'Microsoft Word',
          'Figma',
          'Excel',
          'Notepad'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 3,
        question: 'What is a wireframe?',
        options: [
          'A final product design',
          'A low-fidelity sketch of interface layout',
          'A coding framework',
          'A color palette'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 4,
        question: 'What does "responsive design" mean?',
        options: [
          'Fast loading times',
          'Design that adapts to different screen sizes',
          'Interactive animations',
          'Colorful interfaces'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 5,
        question: 'What is the purpose of user personas?',
        options: [
          'To create fake user accounts',
          'To represent target user groups and their needs',
          'To design logos',
          'To write code'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 6,
        question: 'What is A/B testing?',
        options: [
          'Testing two different versions to see which performs better',
          'Testing alphabetical order',
          'Testing code quality',
          'Testing server performance'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 7,
        question: 'What is the F-pattern in web design?',
        options: [
          'A font style',
          'A common eye-tracking pattern users follow',
          'A Figma shortcut',
          'A failure pattern'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 8,
        question: 'What is the 8-point grid system?',
        options: [
          'A design constraint using multiples of 8 for spacing',
          'A coding standard',
          'A color system',
          'An API framework'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 9,
        question: 'What does "affordance" mean in UX design?',
        options: [
          'The cost of design',
          'Visual cues that suggest how an element should be used',
          'The budget for a project',
          'Animation speed'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 10,
        question: 'What is the primary goal of usability testing?',
        options: [
          'To make the design look pretty',
          'To identify issues users face when interacting with the product',
          'To test code quality',
          'To increase file sizes'
        ],
        correctAnswer: 1,
        points: 10
      }
    ]
  },
  [SkillCategory.ContentWriter]: {
    category: SkillCategory.ContentWriter,
    title: 'Content Writer Certification',
    duration: 60,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: 'What does SEO stand for?',
        options: [
          'Search Engine Optimization',
          'Social Email Organization',
          'Server Engine Operation',
          'Simple Edit Option'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 2,
        question: 'What is a meta description?',
        options: [
          'A description of metadata',
          'A brief summary of web page content shown in search results',
          'A type of programming comment',
          'A Facebook feature'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 3,
        question: 'What is the ideal reading level for web content?',
        options: [
          'PhD level',
          'High school level',
          '8th grade level',
          'Elementary level'
        ],
        correctAnswer: 2,
        points: 10
      },
      {
        id: 4,
        question: 'What is a call-to-action (CTA)?',
        options: [
          'A phone number',
          'A prompt that encourages readers to take specific action',
          'A type of article',
          'A writing style'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 5,
        question: 'What is keyword density?',
        options: [
          'How heavy keywords are',
          'The percentage of times a keyword appears in content',
          'The number of keywords on a page',
          'How important a keyword is'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 6,
        question: 'What is the inverted pyramid style?',
        options: [
          'Upside-down writing',
          'Starting with most important information first',
          'A design pattern',
          'A coding structure'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 7,
        question: 'What is long-form content typically considered?',
        options: [
          'Under 300 words',
          '300-800 words',
          '1000+ words',
          '5000+ words'
        ],
        correctAnswer: 2,
        points: 10
      },
      {
        id: 8,
        question: 'What is plagiarism?',
        options: [
          'A writing technique',
          'Using someone else\'s work without proper attribution',
          'A content management system',
          'A type of grammar error'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 9,
        question: 'What is a content calendar?',
        options: [
          'A calendar with pictures',
          'A schedule for planning and organizing content publication',
          'A holiday schedule',
          'A meeting planner'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 10,
        question: 'What is evergreen content?',
        options: [
          'Content about trees',
          'Content that remains relevant over time',
          'Green-colored text',
          'Seasonal content'
        ],
        correctAnswer: 1,
        points: 10
      }
    ]
  },
  [SkillCategory.DataAnalyst]: {
    category: SkillCategory.DataAnalyst,
    title: 'Data Analyst Certification',
    duration: 90,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: 'What does SQL stand for?',
        options: [
          'Simple Query Language',
          'Structured Query Language',
          'System Quality Logic',
          'Standard Question List'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 2,
        question: 'What is the purpose of a JOIN in SQL?',
        options: [
          'To connect to a database',
          'To combine rows from two or more tables',
          'To create a new table',
          'To delete records'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 3,
        question: 'What is the mean of the dataset: 2, 4, 6, 8, 10?',
        options: [
          '5',
          '6',
          '7',
          '8'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 4,
        question: 'What is a pivot table used for?',
        options: [
          'Rotating data',
          'Summarizing and aggregating data',
          'Creating charts',
          'Storing backups'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 5,
        question: 'What does ETL stand for?',
        options: [
          'Extract, Transform, Load',
          'Enter, Test, Launch',
          'Evaluate, Track, Log',
          'Export, Transfer, Link'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 6,
        question: 'What is data visualization?',
        options: [
          'Looking at raw data',
          'Representing data graphically',
          'Storing data',
          'Encrypting data'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 7,
        question: 'What is the difference between a bar chart and a histogram?',
        options: [
          'No difference',
          'Bar charts show categorical data, histograms show continuous data',
          'Bar charts are vertical, histograms are horizontal',
          'Bar charts are newer'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 8,
        question: 'What is correlation?',
        options: [
          'A type of database',
          'A relationship between two variables',
          'A data cleaning technique',
          'A chart type'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 9,
        question: 'What is the median of: 3, 7, 9, 12, 15?',
        options: [
          '7',
          '9',
          '10',
          '12'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 10,
        question: 'What is data cleaning?',
        options: [
          'Deleting all data',
          'Identifying and correcting errors in datasets',
          'Organizing files',
          'Backing up data'
        ],
        correctAnswer: 1,
        points: 10
      }
    ]
  },
  [SkillCategory.MarketingSpecialist]: {
    category: SkillCategory.MarketingSpecialist,
    title: 'Marketing Specialist Certification',
    duration: 75,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: 'What does ROI stand for?',
        options: [
          'Return on Investment',
          'Rate of Interest',
          'Revenue on Income',
          'Reach of Influence'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 2,
        question: 'What is a conversion rate?',
        options: [
          'Currency exchange rate',
          'Percentage of visitors who complete a desired action',
          'Video quality',
          'Loading speed'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 3,
        question: 'What is the marketing funnel?',
        options: [
          'A tool for collecting data',
          'The customer journey from awareness to purchase',
          'A social media feature',
          'An email template'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 4,
        question: 'What does CTA stand for in marketing?',
        options: [
          'Click Through Analytics',
          'Call to Action',
          'Customer Target Audience',
          'Content Type Analysis'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 5,
        question: 'What is A/B testing in marketing?',
        options: [
          'Testing two versions to see which performs better',
          'Grading campaigns',
          'Testing alphabetical lists',
          'Budget allocation'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 6,
        question: 'What is organic reach?',
        options: [
          'Farming marketing',
          'Unpaid content reach',
          'Health food advertising',
          'Natural product sales'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 7,
        question: 'What is a buyer persona?',
        options: [
          'A purchasing agent',
          'A semi-fictional representation of your ideal customer',
          'A sales technique',
          'A payment method'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 8,
        question: 'What is email marketing automation?',
        options: [
          'Automatic email deletion',
          'Sending targeted emails triggered by user actions',
          'Spam filtering',
          'Email sorting'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 9,
        question: 'What is influencer marketing?',
        options: [
          'Marketing to managers',
          'Partnering with individuals who have influence over potential customers',
          'Political advertising',
          'Celebrity gossip'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 10,
        question: 'What is a landing page?',
        options: [
          'A homepage',
          'A standalone page designed for a specific campaign',
          'A footer',
          'A 404 error page'
        ],
        correctAnswer: 1,
        points: 10
      }
    ]
  },
  [SkillCategory.FrontendDeveloper]: {
    category: SkillCategory.FrontendDeveloper,
    title: 'Frontend Developer Certification',
    duration: 120,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: 'What does HTML stand for?',
        options: [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Home Tool Markup Language',
          'Hyperlinks and Text Markup Language'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 2,
        question: 'Which CSS property is used for changing text color?',
        options: [
          'text-color',
          'color',
          'font-color',
          'text-style'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 3,
        question: 'What is React?',
        options: [
          'A database',
          'A JavaScript library for building UIs',
          'A CSS framework',
          'A backend server'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 4,
        question: 'What does the DOM stand for?',
        options: [
          'Document Object Model',
          'Data Output Method',
          'Digital Online Media',
          'Database Object Manager'
        ],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 5,
        question: 'Which method is used to add an element at the end of an array?',
        options: [
          'add()',
          'push()',
          'append()',
          'insert()'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 6,
        question: 'What is TypeScript?',
        options: [
          'A text editor',
          'A superset of JavaScript with static typing',
          'A database query language',
          'A CSS preprocessor'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 7,
        question: 'What is the purpose of useState in React?',
        options: [
          'To fetch data',
          'To manage component state',
          'To style components',
          'To route pages'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 8,
        question: 'What is responsive design?',
        options: [
          'Fast loading pages',
          'Design that adapts to different screen sizes',
          'Interactive animations',
          'Server responses'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 9,
        question: 'What is the box model in CSS?',
        options: [
          'A container component',
          'Content, padding, border, and margin',
          'A grid layout',
          'A flexbox property'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 10,
        question: 'What is an API?',
        options: [
          'A programming language',
          'Application Programming Interface',
          'A design pattern',
          'A testing framework'
        ],
        correctAnswer: 1,
        points: 10
      }
    ]
  }
};
