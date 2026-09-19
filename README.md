# FocusList 🚀

FocusList is a responsive, frontend-only daily task management application built for the FocusList Challenge.

## Live Demo

https://focuslist-five.vercel.app/

## Features

- Create new tasks
- Mark tasks as completed
- Edit existing tasks
- Delete tasks
- High, Medium and Low priority
- Search tasks by title
- Filter by All, Active and Completed
- Filter tasks by priority
- Dynamic Total, Completed and Pending statistics
- LocalStorage persistence
- Responsive desktop and mobile interface
- Clear visual distinction between completed and pending tasks
- Keyboard support for task creation and editing
- Accessible labels and interactive controls

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser LocalStorage

## Architecture

The application follows a simple frontend architecture:

User Action
↓
JavaScript State
↓
LocalStorage
↓
Render
↓
Updated User Interface

### Files

`index.html`
- Semantic page structure
- Forms, filters, statistics and task interface
- Accessibility attributes

`style.css`
- Responsive layout
- Visual design
- Task states
- Mobile breakpoints
- Interactive feedback

`script.js`
- Task state management
- CRUD operations
- Search and filtering
- Statistics calculation
- LocalStorage persistence
- DOM rendering
- Input validation

## Data Model

Each task contains:

- id
- title
- priority
- completed
- createdAt

## Performance and Security

- No backend or external database
- No external runtime dependencies
- Uses browser LocalStorage for persistence
- Task titles are rendered safely using DOM text content
- Input length validation is implemented
- Responsive CSS reduces unnecessary layout complexity

## Accessibility

- Semantic HTML
- Accessible form labels
- ARIA labels for task controls
- Keyboard interaction support
- Visible focus states
- Status filters are keyboard accessible

## Deployment

The application is deployed as a static frontend application using Vercel.

## Challenge Alignment

FocusList implements the required task creation, task management, priority management, search, filtering, statistics, LocalStorage persistence, responsive UI and frontend-only technical requirements.
