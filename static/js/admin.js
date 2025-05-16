function applyFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const year = document.getElementById('year').value;
    const sem = document.getElementById('sem').value;
    const section = document.getElementById('section').value;
    const department = document.getElementById('department').value;
    const academicYear = document.getElementById('academic_year').value;

    // Get all response cards
    const responseCards = document.querySelectorAll('.response-card');

    responseCards.forEach(card => {
        let show = true;

        // Search by name or roll number
        if (searchTerm) {
            const name = card.querySelector('[data-name]')?.getAttribute('data-name')?.toLowerCase() || '';
            const rollNumber = card.querySelector('[data-roll]')?.getAttribute('data-roll')?.toLowerCase() || '';
            if (!name.includes(searchTerm) && !rollNumber.includes(searchTerm)) {
                show = false;
            }
        }

        // Filter by year
        if (year && card.getAttribute('data-year') !== year) {
            show = false;
        }

        // Filter by semester
        if (sem && card.getAttribute('data-sem') !== sem) {
            show = false;
        }

        // Filter by section
        if (section && card.getAttribute('data-section') !== section) {
            show = false;
        }

        // Filter by department
        if (department && card.getAttribute('data-department') !== department) {
            show = false;
        }

        // Filter by academic year
        if (academicYear && card.getAttribute('data-academic-year') !== academicYear) {
            show = false;
        }

        // Show/hide card based on filters
        card.style.display = show ? 'block' : 'none';
    });
}

// Add event listeners for real-time filtering
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['search', 'year', 'sem', 'section', 'department', 'academic_year'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', applyFilters);
    });
});
