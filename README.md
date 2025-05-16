# Course Exit Survey Application

A web application for collecting course exit surveys from students.

## Features

-   Student information collection
-   General course feedback questions
-   Subject-specific feedback with course outcome ratings
-   Course code autocomplete with course outcome auto-filling
-   Admin panel for viewing responses
-   Export functionality to CSV or Excel

## How to Use the Course Code Suggestion Feature

1. When adding a new subject in the survey, start typing the course code in the "Course Code" field.
2. A dropdown with matching courses will appear.
3. Click on a course to select it.
4. The course name will automatically be filled in.
5. The course outcomes (CO1-CO5) will be automatically populated from the curriculum data.
6. Rate each course outcome as required.

## Technical Details

-   Built with Flask (Python)
-   Uses SQLite for data storage
-   Interactive front-end using JavaScript and jQuery
-   Course data loaded from Extended_Full_CSE_Curriculum.json
