from flask import Flask, render_template, request, redirect, url_for, send_file
from flask_sqlalchemy import SQLAlchemy
import pandas as pd
import os
import io

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
    data = request.form
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

    question_count = int(data.get('question_count'))
    for i in range(question_count):
        q_text = data.get(f'q_text_{i}')
        q_rating = data.get(f'q_rating_{i}')
        response.questions.append(GeneralQuestionResponse(question_text=q_text, rating=q_rating))

    subject_count = int(data.get('subject_count'))
    for i in range(subject_count):
        subject = SubjectFeedback(subject_name=data.get(f'subject_name_{i}'))
        co_count = int(data.get(f'co_count_{i}'))
        for j in range(co_count):
            co_q = data.get(f'co_q_{i}_{j}')
            co_r = data.get(f'co_r_{i}_{j}')
            subject.co_questions.append(COFeedback(co_question=co_q, co_rating=co_r))
        response.subjects.append(subject)

    db.session.add(response)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/adminofCES')
def admin():
    responses = SurveyResponse.query.all()
    return render_template('admin.html', responses=responses)

@app.route('/export/<string:filetype>')
def export(filetype):
    responses = SurveyResponse.query.all()
    data = []
    for r in responses:
        base_info = {
            'full_name': r.full_name,
            'program_type': r.program_type,
            'department': r.department,
            'year_semester': r.year_semester,
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)