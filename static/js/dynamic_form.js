let questionCount = 0;
let subjectCount = 0;

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

	div.innerHTML = `
        <div class="subject-header">
            <h4 class="subject-title">New Subject</h4>
            <button type="button" class="remove-btn" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="form-group">
            <label for="subject_name_${subjectCount}">Course Code:</label>
            <input type="text" name="subject_name_${subjectCount}" id="subject_name_${subjectCount}" required placeholder="e.g., CS101">
        </div>
        <div id="${coContainerId}" class="co-container"></div>
        <button type="button" class="btn btn-add" onclick="addCO('${coContainerId}', ${subjectCount})">Add Course Outcome</button>
        <input type="hidden" name="co_count_${subjectCount}" id="co_count_${subjectCount}" value="0">
    `;
	container.appendChild(div);
	subjectCount++;
	document.getElementById("subject_count").value = subjectCount;
}

function addCO(containerId, subjectIndex) {
	const container = document.getElementById(containerId);
	const countInput = document.getElementById(`co_count_${subjectIndex}`);
	const coIndex = parseInt(countInput.value);

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
	countInput.value = coIndex + 1;
}
