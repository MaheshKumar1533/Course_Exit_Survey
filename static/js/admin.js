function applyFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const year = document.getElementById('year').value;
    const sem = document.getElementById('sem').value;
    const section = document.getElementById('section').value;
    const department = document.getElementById('department').value;
    const academicYear = document.getElementById('academic_year').value;

    const responseCards = document.querySelectorAll('.response-card');

    responseCards.forEach(card => {
        let show = true;

        if (searchTerm) {
            const name = card.getAttribute('data-name').toLowerCase();
            const rollNumber = card.getAttribute('data-roll').toLowerCase();
            if (!name.includes(searchTerm) && !rollNumber.includes(searchTerm)) {
                show = false;
            }
        }

        if (year && card.getAttribute('data-year') !== year) show = false;
        if (sem && card.getAttribute('data-sem') !== sem) show = false;
        if (section && card.getAttribute('data-section') !== section) show = false;
        if (department && card.getAttribute('data-department') !== department) show = false;
        if (academicYear && card.getAttribute('data-academic-year') !== academicYear) show = false;

        card.style.display = show ? 'block' : 'none';
    });

    calculateAverages();
}

function createCourseList() {
    const visibleCards = Array.from(document.querySelectorAll('.response-card')).filter(card => 
        card.style.display !== 'none'
    );

    // Get unique courses and their data
    const courses = {};
    visibleCards.forEach(card => {
        const subjects = card.querySelectorAll('.subject-section');
        subjects.forEach(subject => {
            const courseCode = subject.querySelector('.subject-title').textContent.trim();
            const avgRating = parseFloat(subject.getAttribute('data-average')) || 0;
            
            if (!courses[courseCode]) {
                courses[courseCode] = {
                    cos: {},
                    totalResponses: 0,
                    totalAverage: 0,
                    averageCount: 0
                };
            }

            // Add the subject's average to the course totals
            if (avgRating > 0) {
                courses[courseCode].totalAverage += avgRating;
                courses[courseCode].averageCount++;
            }
            courses[courseCode].totalResponses++;

            // Process individual CO ratings
            const coQuestions = subject.querySelectorAll('.question-list-item');
            coQuestions.forEach(q => {
                const text = q.querySelector('.question-text').textContent.trim();
                const rating = parseFloat(q.querySelector('.question-rating').textContent.replace('Rating: ', ''));
                
                if (!courses[courseCode].cos[text]) {
                    courses[courseCode].cos[text] = { sum: 0, count: 0 };
                }
                courses[courseCode].cos[text].sum += rating;
                courses[courseCode].cos[text].count++;
            });
        });
    });

    // Update the UI with course averages
    const courseList = document.querySelector('#subject-averages .course-list');
    courseList.innerHTML = '';
    const courseGrid = document.createElement('div');
    courseGrid.className = 'course-grid';

    Object.entries(courses)
        .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
        .forEach(([courseCode, data]) => {
            const overallAverage = data.averageCount > 0 
                ? (data.totalAverage / data.averageCount).toFixed(2) 
                : "N/A";

            const courseDiv = document.createElement('div');
            courseDiv.className = 'course-item';
            courseDiv.innerHTML = `
                <div class="course-header" onclick="toggleCourseDetails('${courseCode}')">
                    <span class="expand-icon">▶</span>
                    <div class="course-title">
                        <span class="course-code">${courseCode}</span>
                        <span class="course-average">(Avg: ${overallAverage})</span>
                    </div>
                </div>
                <div class="course-details" id="course-${courseCode}" style="display: none;">
                    <div class="course-stats">
                        <span class="response-count">Total Responses: ${data.totalResponses}</span>
                    </div>
                    <div class="co-grid">
                        ${Object.entries(data.cos)
                            .sort((a, b) => {
                                const coNumA = parseInt(a[0].match(/CO(\d+)/)?.[1] || 0);
                                const coNumB = parseInt(b[0].match(/CO(\d+)/)?.[1] || 0);
                                return coNumA - coNumB;
                            })
                            .map(([coText, coData]) => `
                                <div class="co-item">
                                    <div class="co-text">${coText}</div>
                                    <div class="co-average">
                                        <div class="rating-value">${(coData.sum / coData.count).toFixed(2)}</div>
                                        <div class="rating-count">(${coData.count} responses)</div>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>
            `;
            courseGrid.appendChild(courseDiv);
        });

    courseList.appendChild(courseGrid);
}

function toggleCourseDetails(courseCode) {
    const courseDetails = document.getElementById(`course-${courseCode}`);
    const icon = courseDetails.previousElementSibling.querySelector('.expand-icon');
    
    if (courseDetails.style.display === 'none') {
        courseDetails.style.display = 'block';
        icon.textContent = '▼';
    } else {
        courseDetails.style.display = 'none';
        icon.textContent = '▶';
    }
}

function calculateAverages() {
    // Calculate general question averages
    const visibleCards = Array.from(document.querySelectorAll('.response-card')).filter(card => 
        card.style.display !== 'none'
    );

    const generalQuestions = {};
    visibleCards.forEach(card => {
        const questions = card.querySelectorAll('.general-questions .question-list-item');
        questions.forEach(q => {
            const text = q.querySelector('.question-text').textContent.trim();
            const rating = parseFloat(q.querySelector('.question-rating').textContent.replace('Rating: ', ''));
            
            if (!generalQuestions[text]) {
                generalQuestions[text] = { sum: 0, count: 0 };
            }
            generalQuestions[text].sum += rating;
            generalQuestions[text].count++;
        });
    });

    // Update general averages display
    const generalAvgContainer = document.getElementById('general-averages');
    generalAvgContainer.innerHTML = '<h3>General Questions Averages</h3>';
    
    Object.entries(generalQuestions).forEach(([question, data]) => {
        const avg = (data.sum / data.count).toFixed(2);
        generalAvgContainer.innerHTML += `
            <div class="average-item">
                <span class="question-text">${question}</span>
                <span class="average-rating">Average: ${avg}</span>
            </div>
        `;
    });

    createCourseList();
}

// Function to toggle response expansion
function toggleResponse(header) {
    const responseCard = header.closest('.response-card');
    const responseBody = responseCard.querySelector('.response-body');
    const expandIcon = header.querySelector('.expand-icon');
    
    // Close all other expanded responses first
    const allResponseBodies = document.querySelectorAll('.response-body');
    const allExpandIcons = document.querySelectorAll('.expand-icon');
    
    allResponseBodies.forEach(body => {
        if (body !== responseBody) {
            body.style.display = 'none';
        }
    });
    
    allExpandIcons.forEach(icon => {
        if (icon !== expandIcon) {
            icon.style.transform = 'rotate(0deg)';
        }
    });
    
    // Toggle the clicked response
    if (responseBody.style.display === 'none' || !responseBody.style.display) {
        responseBody.style.display = 'block';
        expandIcon.style.transform = 'rotate(180deg)';
    } else {
        responseBody.style.display = 'none';
        expandIcon.style.transform = 'rotate(0deg)';
    }
}

function downloadResponderDetails(responseId) {
    // Create request URL with response ID
    const url = `/export/responder/${responseId}`;
    
    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `response_${responseId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
