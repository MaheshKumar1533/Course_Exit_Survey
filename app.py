from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
import pandas as pd
import os
import io
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///survey.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class SurveyResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100))
    roll_number = db.Column(db.String(20))
    program_type = db.Column(db.String(10))
    department = db.Column(db.String(50))
    year = db.Column(db.Integer)
    sem = db.Column(db.Integer)
    section = db.Column(db.String(10))
    academic_year = db.Column(db.String(20))
    questions = db.relationship('GeneralQuestionResponse', backref='survey', cascade="all, delete-orphan")
    subjects = db.relationship('SubjectFeedback', backref='survey', cascade="all, delete-orphan")

class GeneralQuestionResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey('survey_response.id'))
    question_text = db.Column(db.String(255))
    rating = db.Column(db.Integer)

class SubjectFeedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey('survey_response.id'))
    subject_name = db.Column(db.String(100))
    average_rating = db.Column(db.Float, default=0.0)
    co1_average = db.Column(db.Float, default=0.0)
    co2_average = db.Column(db.Float, default=0.0)
    co3_average = db.Column(db.Float, default=0.0)
    co4_average = db.Column(db.Float, default=0.0)
    co5_average = db.Column(db.Float, default=0.0)
    co_questions = db.relationship('COFeedback', backref='subject', cascade="all, delete-orphan")

class COFeedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject_feedback.id'))
    co_question = db.Column(db.String(255))
    co_rating = db.Column(db.Integer)

@app.route('/')
def index():
    return render_template('survey.html')

@app.route('/submit', methods=['POST'])
def submit():
    try:
        data = request.form
        print("Received form data with the following keys:", list(data.keys()))
        
        response = SurveyResponse(
            full_name=data.get('full_name'),
            program_type=data.get('program_type'),
            roll_number=data.get('roll_number'),
            department=data.get('department'),
            year=data.get('year'),
            sem=data.get('sem'),
            section=data.get('section'),
            academic_year=data.get('academic_year')
        )

        question_count = int(data.get('question_count', 0))
        for i in range(question_count):
            q_text = data.get(f'q_text_{i}')
            q_rating = data.get(f'q_rating_{i}')
            response.questions.append(GeneralQuestionResponse(question_text=q_text, rating=q_rating))

        subject_count = int(data.get('subject_count', 0))
        print(f"Processing {subject_count} subjects")
        
        for i in range(subject_count):
            course_code = data.get(f'course_code_{i}')
            print(f"Adding subject {i} with course code: {course_code}")  # Debug log
            subject = SubjectFeedback(subject_name=course_code)
            
            co_count_value = data.get(f'co_count_{i}')
            print(f"CO count value for subject {i}: {co_count_value}")
            
            try:
                # Only attempt to convert to int if the value is not None
                co_count = int(co_count_value) if co_count_value is not None else 5
            except (ValueError, TypeError):
                # Handle both ValueError (invalid literal) and TypeError cases
                co_count = 5
                print(f"Using default CO count of 5 for subject {i}")
            print(f"Found {co_count} COs for subject {i}")
            
            # Initialize arrays to store CO ratings
            co_ratings = []
            
            # Dictionary to store CO-wise ratings
            co_wise_ratings = {f"CO{j+1}": [] for j in range(5)}  # Initialize for 5 COs
            
            for j in range(co_count):
                co_q = data.get(f'co_q_{i}_{j}', '')  # Default to empty string if None
                co_r = data.get(f'co_r_{i}_{j}')
                
                print(f"Subject {i}, CO{j+1} - Question: {co_q}, Rating: {co_r}")
                
                # Only try to parse the rating if it's not None and not empty
                if co_r:
                    try:
                        co_rating = int(co_r)
                        co_num = j + 1
                        co_wise_ratings[f"CO{co_num}"].append(co_rating)
                    except (ValueError, TypeError):
                        print(f"Warning: Invalid rating value for CO{j+1}: {co_r}")
                        
                # Don't store None values in the database - convert to empty string or 0 as appropriate
                subject.co_questions.append(COFeedback(
                    co_question=co_q if co_q is not None else '',
                    co_rating=int(co_r) if co_r else 0
                ))
            
            # Calculate averages for each CO and overall average
            total_sum = 0
            valid_cos = 0
            
            # Calculate and store individual CO averages
            for co_num in range(1, 6):
                co_ratings = co_wise_ratings[f"CO{co_num}"]
                if co_ratings:  # If we have ratings for this CO
                    co_avg = sum(co_ratings) / len(co_ratings)
                    # Set the individual CO average
                    setattr(subject, f'co{co_num}_average', round(co_avg, 2))
                    total_sum += co_avg
                    valid_cos += 1
                    print(f"Subject {course_code} CO{co_num} average: {co_avg}")  # Debug log
            
            # Calculate and set the overall average
            if valid_cos > 0:
                subject.average_rating = round(total_sum / valid_cos, 2)
                print(f"Subject {course_code} overall average: {subject.average_rating}")  # Debug log
            
            response.subjects.append(subject)

        db.session.add(response)
        db.session.commit()
        return redirect(url_for('index'))
    except Exception as e:
        app.logger.error(f"Error in submit: {str(e)}")
        app.logger.error(f"Error details: {type(e).__name__}")
        import traceback
        app.logger.error(traceback.format_exc())
        return f"An error occurred while submitting the form: {str(e)}", 500

@app.route('/adminofCES')
def admin():
    responses = SurveyResponse.query.all()
    return render_template('admin.html', responses=responses)

@app.route('/export/<string:filetype>')
def export(filetype):
    responses = SurveyResponse.query.all()
    data = []
    for r in responses:
        # Combine year and sem fields
        year_sem = f"{r.year} Year {r.sem} Sem" if r.year and r.sem else ""
        base_info = {
            'full_name': r.full_name,
            'program_type': r.program_type,
            'department': r.department,
            'roll_number': r.roll_number,
            'year_semester': year_sem,
            'section': r.section,
            'academic_year': r.academic_year
        }
        for q in r.questions:
            row = base_info.copy()
            row.update({
                'question_text': q.question_text,
                'rating': q.rating,
                'subject_name': '',
                'co_question': '',
                'co_rating': ''
            })
            data.append(row)
        for subj in r.subjects:
            for co in subj.co_questions:
                row = base_info.copy()
                row.update({
                    'question_text': '',
                    'rating': '',
                    'subject_name': subj.subject_name,
                    'co_question': co.co_question,
                    'co_rating': co.co_rating
                })
                data.append(row)

    df = pd.DataFrame(data)
    file_stream = io.BytesIO()
    if filetype == 'xlsx':
        df.to_excel(file_stream, index=False)
        file_stream.seek(0)
        return send_file(file_stream, as_attachment=True, download_name='survey_export.xlsx')
    elif filetype == 'csv':
        df.to_csv(file_stream, index=False)
        file_stream.seek(0)
        return send_file(file_stream, as_attachment=True, download_name='survey_export.csv')
    return "Invalid filetype"

# Route to serve course data from JSON file
@app.route('/api/courses')
def get_courses():
    try:
        json_path = os.path.join(os.path.dirname(__file__), 'Extended_Full_CSE_Curriculum.json')
        with open(json_path, 'r') as file:
            courses = json.load(file)
        return jsonify(courses)
    except Exception as e:
        app.logger.error(f"Error loading course data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/export/responder/<int:response_id>')
def export_responder(response_id):
    response = SurveyResponse.query.get_or_404(response_id)
    data = []
    
    # Create base info dict with combined year and sem
    base_info = {
        'Student Name': response.full_name,
        'Roll Number': response.roll_number,
        'Program': response.program_type,
        'Department': response.department,
        'Year & Semester': f"{response.year} Year {response.sem} Sem",
        'Section': response.section,
        'Academic Year': response.academic_year
    }
    
    # Add general questions
    for q in response.questions:
        data.append({
            'Category': 'General',
            'Question': q.question_text,
            'Rating': q.rating,
            'Subject': '',
            'CO': ''
        })
    
    # Add subject CO questions
    for subject in response.subjects:
        for co in subject.co_questions:
            data.append({
                'Category': 'Subject',
                'Question': co.co_question,
                'Rating': co.co_rating,
                'Subject': subject.subject_name,
                'CO': f'CO{co.id % 5 + 1}'  # Assuming 5 COs per subject
            })

    # Create DataFrame and export to CSV
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'response_{response_id}.csv'
    )

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)