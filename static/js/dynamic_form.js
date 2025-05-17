let questionCount = 0;
let subjectCount = 0;
let courseData = [];

// Load the course data from the API when the page loads
document.addEventListener("DOMContentLoaded", () => {
	fetch("/api/courses")
		.then((response) => response.json())
		.then((data) => {
			courseData = data;
			console.log("Course data loaded successfully");
			console.log("Loaded " + courseData.length + " courses");
		})
		.catch((error) => {
			console.error("Error loading course data:", error);
		});
});

function addQuestion() {
	const container = document.getElementById("general-questions");
	const div = document.createElement("div");
	div.className = "question-item";
	div.innerHTML = `
        <label>Question ${questionCount + 1}:</label>
        <input type="text" name="q_text_${questionCount}" required>
        <div class="rating-group">
            <div class="rating-option">
                <input type="radio" id="q_${questionCount}_rating_1" name="q_rating_${questionCount}" value="1" required>
                <label for="q_${questionCount}_rating_1">1</label>
            </div>
            <div class="rating-option">
                <input type="radio" id="q_${questionCount}_rating_2" name="q_rating_${questionCount}" value="2">
                <label for="q_${questionCount}_rating_2">2</label>
            </div>
            <div class="rating-option">
                <input type="radio" id="q_${questionCount}_rating_3" name="q_rating_${questionCount}" value="3">
                <label for="q_${questionCount}_rating_3">3</label>
            </div>
            <div class="rating-option">
                <input type="radio" id="q_${questionCount}_rating_4" name="q_rating_${questionCount}" value="4">
                <label for="q_${questionCount}_rating_4">4</label>
            </div>
            <div class="rating-option">
                <input type="radio" id="q_${questionCount}_rating_5" name="q_rating_${questionCount}" value="5">
                <label for="q_${questionCount}_rating_5">5</label>
            </div>
        </div>
    `;
	container.appendChild(div);
	questionCount++;
	document.getElementById("question_count").value = questionCount;
}

function addSubject() {
	const container = document.getElementById("subjects");
	const subjectId = `subject_${subjectCount}`;
	const coContainerId = `cos_${subjectCount}`;
	const div = document.createElement("div");
	div.className = "subject-section";
	// Add a data attribute to store the subject index
	div.setAttribute("data-subject-index", subjectCount);

	div.innerHTML = `
        <div class="subject-header">
            <h4 class="subject-title">New Subject</h4>
            <button type="button" class="remove-btn" onclick="removeSubject(this)">×</button>
        </div>
        <div class="form-group">
            <label for="course_code_${subjectCount}">Course Code:</label>
            <input type="text" name="course_code_${subjectCount}" id="course_code_${subjectCount}" 
                   data-subject-index="${subjectCount}"
                   required placeholder="Type to search course code or name" class="course-code-input">
            <div id="course_suggestions_${subjectCount}" class="course-suggestions"></div>
        </div>
        <div class="form-group">
            <label for="subject_name_${subjectCount}">Course Name:</label>
            <input type="text" name="subject_name_${subjectCount}" id="subject_name_${subjectCount}" required>
        </div>
        <div id="${coContainerId}" class="co-container"></div>
        <input type="hidden" name="co_count_${subjectCount}" id="co_count_${subjectCount}" value="5">
    `;
	container.appendChild(div);

	// Add exactly 5 COs automatically
	for (let i = 0; i < 5; i++) {
		addCO(coContainerId, subjectCount, i);
	}

	// Add event listeners for the course code input field
	const courseCodeInput = document.getElementById(
		`course_code_${subjectCount}`
	);

	// Use a more robust way to handle events
	courseCodeInput.addEventListener("input", function () {
		const index = this.getAttribute("data-subject-index");
		suggestCourses(this.value, index);
	});

	courseCodeInput.addEventListener("focus", function () {
		const index = this.getAttribute("data-subject-index");
		if (this.value.length >= 2) {
			suggestCourses(this.value, index);
		}
	});

	subjectCount++;
	document.getElementById("subject_count").value = subjectCount;
	updateSubmitButton();
}

// Function to suggest courses based on user input
function suggestCourses(query, subjectIndex) {
	if (!courseData || courseData.length === 0) {
		console.error("Course data not loaded yet");
		return;
	}

	query = query.toLowerCase().trim();

	// Get the suggestions div safely
	const suggestionsDiv = document.getElementById(
		`course_suggestions_${subjectIndex}`
	);
	if (!suggestionsDiv) {
		console.error(
			`Could not find suggestions div for subject ${subjectIndex}`
		);
		return;
	}

	if (query.length < 2) {
		suggestionsDiv.innerHTML = "";
		return;
	}

	console.log(`Searching for: ${query} in ${courseData.length} courses`);

	const filteredCourses = courseData
		.filter((course) => {
			if (!course || !course.coursecode || !course.coursename)
				return false;
			const courseCode = course.coursecode.toLowerCase();
			const courseName = course.coursename.toLowerCase();
			return courseCode.includes(query) || courseName.includes(query);
		})
		.slice(0, 5); // Limit to 5 suggestions

	console.log(`Found ${filteredCourses.length} matching courses`);

	// Clear the suggestions
	suggestionsDiv.innerHTML = "";

	// Add each suggestion
	filteredCourses.forEach((course) => {
		const suggestion = document.createElement("div");
		suggestion.classList.add("course-suggestion");
		suggestion.textContent = `${course.coursecode} - ${course.coursename}`;
		suggestion.addEventListener("click", () => {
			selectCourse(course, subjectIndex);
			suggestionsDiv.innerHTML = "";
		});
		suggestionsDiv.appendChild(suggestion);
	});
}

// Function to select a course and fill in the details
function selectCourse(course, subjectIndex) {
	// Try to find the elements safely
	const courseCodeField = document.getElementById(
		`course_code_${subjectIndex}`
	);
	const courseNameField = document.getElementById(
		`subject_name_${subjectIndex}`
	);

	if (!courseCodeField || !courseNameField) {
		console.error(
			`Could not find course fields for subject ${subjectIndex}`
		);
		return;
	}

	// Set the course code and name
	courseCodeField.value = course.coursecode;
	courseNameField.value = course.coursename;

	// Fill in the course outcomes
	if (course.courseoutcomes) {
		console.log("Filling COs for course: " + course.coursecode);
		// First clear any existing values
		for (let i = 0; i < 5; i++) {
			const coField = document.getElementById(
				`co_q_${subjectIndex}_${i}`
			);
			if (coField) {
				coField.value = "";
			}
		}

		// Then fill in the new values
		Object.entries(course.courseoutcomes).forEach(([key, value], index) => {
			const coField = document.getElementById(
				`co_q_${subjectIndex}_${index}`
			);
			if (coField) {
				coField.value = value;
				console.log(`Set CO${index + 1}: ${value}`);
			} else {
				console.warn(
					`Could not find CO field ${index} for subject ${subjectIndex}`
				);
			}
		});
	} else {
		console.warn("No course outcomes found for: " + course.coursecode);
	}
}

// Update addCO to accept optional coIndex
function addCO(containerId, subjectIndex, coIndexParam) {
	const container = document.getElementById(containerId);
	const countInput = document.getElementById(`co_count_${subjectIndex}`);
	let coIndex;
	if (typeof coIndexParam === "number") {
		coIndex = coIndexParam;
	} else {
		coIndex = parseInt(countInput.value);
		countInput.value = coIndex + 1;
	}

	const div = document.createElement("div");
	div.className = "question-item";
	div.innerHTML = `
        <div class="form-group">
            <label for="co_q_${subjectIndex}_${coIndex}">CO${
		coIndex + 1
	} Question:</label>
            <input type="text" name="co_q_${subjectIndex}_${coIndex}" id="co_q_${subjectIndex}_${coIndex}" 
                   required placeholder="Enter the course outcome question">
        </div>
        <div class="form-group">
            <label>Rating:</label>
            <div class="rating-group">
                <div class="rating-option">
                    <input type="radio" id="co_${subjectIndex}_${coIndex}_rating_1" 
                           name="co_r_${subjectIndex}_${coIndex}" value="1" required>
                    <label for="co_${subjectIndex}_${coIndex}_rating_1">1</label>
                </div>
                <div class="rating-option">
                    <input type="radio" id="co_${subjectIndex}_${coIndex}_rating_2" 
                           name="co_r_${subjectIndex}_${coIndex}" value="2">
                    <label for="co_${subjectIndex}_${coIndex}_rating_2">2</label>
                </div>
                <div class="rating-option">
                    <input type="radio" id="co_${subjectIndex}_${coIndex}_rating_3" 
                           name="co_r_${subjectIndex}_${coIndex}" value="3">
                    <label for="co_${subjectIndex}_${coIndex}_rating_3">3</label>
                </div>
                <div class="rating-option">
                    <input type="radio" id="co_${subjectIndex}_${coIndex}_rating_4" 
                           name="co_r_${subjectIndex}_${coIndex}" value="4">
                    <label for="co_${subjectIndex}_${coIndex}_rating_4">4</label>
                </div>
                <div class="rating-option">
                    <input type="radio" id="co_${subjectIndex}_${coIndex}_rating_5" 
                           name="co_r_${subjectIndex}_${coIndex}" value="5">
                    <label for="co_${subjectIndex}_${coIndex}_rating_5">5</label>
                </div>
            </div>
        </div>
    `;
	container.appendChild(div);
}

// Function to properly remove a subject and update counts
function removeSubject(button) {
	const subjectSection = button.closest(".subject-section");
	if (subjectSection) {
		subjectSection.remove();

		// Update the subject count
		const subjectsContainer = document.getElementById("subjects");
		const remainingSubjects =
			subjectsContainer.querySelectorAll(".subject-section").length;
		document.getElementById("subject_count").value = remainingSubjects;

		updateSubmitButton();
		console.log(
			`Removed a subject. Remaining subjects: ${remainingSubjects}`
		);
	}
}

function updateSubmitButton() {
	const submitButton = document.querySelector(".submit-btn");
	const subjectsCount = document.querySelectorAll(".subject-section").length;

	if (subjectsCount < 7) {
		submitButton.disabled = true;
		submitButton.title = `Please add at least ${
			7 - subjectsCount
		} more subject(s)`;
		// Add visual indication
		submitButton.style.opacity = "0.5";
		submitButton.style.cursor = "not-allowed";
	} else {
		submitButton.disabled = false;
		submitButton.title = "";
		submitButton.style.opacity = "1";
		submitButton.style.cursor = "pointer";
	}
}

// Add form submission validation
document.addEventListener("DOMContentLoaded", function () {
	const form = document.querySelector("form");
	updateSubmitButton(); // Initial check

	form.addEventListener("submit", function (event) {
		// Check required number of subjects
		const subjectsCount =
			document.querySelectorAll(".subject-section").length;
		if (subjectsCount < 7) {
			event.preventDefault();
			alert(
				`You need to add at least ${
					7 - subjectsCount
				} more subject(s) before submitting.`
			);
			return;
		}

		// Verify all subject fields have valid data
		let hasErrors = false;
		const subjectSections = document.querySelectorAll(".subject-section");

		subjectSections.forEach((section, index) => {
			// Ensure each subject has a course code
			const courseCode = section.querySelector(
				`input[name="course_code_${index}"]`
			);
			if (!courseCode || !courseCode.value.trim()) {
				hasErrors = true;
				event.preventDefault();
				courseCode.classList.add("error-field");
			}

			// Ensure each subject has CO counts
			const coCountField = section.querySelector(
				`input[name="co_count_${index}"]`
			);
			if (!coCountField || !coCountField.value) {
				console.log(`Setting default CO count for subject ${index}`);
				// Set default value of 5 if not present
				if (coCountField) coCountField.value = 5;
			}

			// Ensure CO questions have ratings selected
			const coCount = coCountField
				? parseInt(coCountField.value) || 5
				: 5;
			for (let j = 0; j < coCount; j++) {
				const hasRating = document.querySelector(
					`input[name="co_r_${index}_${j}"]:checked`
				);
				if (!hasRating) {
					hasErrors = true;
					event.preventDefault();
					const ratingGroup = section.querySelector(
						`.co-container > div:nth-child(${j + 1}) .rating-group`
					);
					if (ratingGroup)
						ratingGroup.classList.add("error-highlight");
				}
			}
		});

		if (hasErrors) {
			alert("Please fill in all required fields marked in red.");
		}
	});
});
