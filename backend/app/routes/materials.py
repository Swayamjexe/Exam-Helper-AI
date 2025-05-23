from flask import Blueprint, request, jsonify, current_app, g, send_file
from werkzeug.utils import secure_filename
import os
import sys
import traceback

from ..services.material_service import MaterialService
from ..services.vector_service import VectorService
from ..services.text_processor import TextProcessor
from ..utils.auth import login_required

# Blueprint for material routes
materials_bp = Blueprint('materials', __name__, url_prefix='/api/materials')

# Initialize services
vector_service = VectorService()
text_processor = TextProcessor()

@materials_bp.route('', methods=['POST'])
@login_required
def upload_material():
    """Upload a new material"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Check file extension
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1].lower()[1:]  # Remove dot
        
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', ['pdf', 'txt', 'docx'])
        if ext not in allowed_extensions:
            return jsonify({'error': f'File type {ext} not allowed'}), 400
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        material_type = request.form.get('material_type')
        
        # Initialize material service
        material_service = MaterialService(g.db, vector_service, text_processor)
        
        # Upload and process material
        material = material_service.upload_material(
            file, g.user['id'], title, description, material_type
        )
        
        # Return response
        return jsonify({
            'material': {
                'id': material.id,
                'title': material.title,
                'description': material.description,
                'fileName': os.path.basename(material.file_path) if material.file_path else "",
                'fileType': material.file_type,
                'material_type': material.material_type,
                'status': material.embedding_status,
                'pageCount': material.page_count,
                'wordCount': material.word_count,
                'author': material.author,
                'createdAt': material.created_at.isoformat() if material.created_at else None,
                'updatedAt': material.updated_at.isoformat() if material.updated_at else None,
            }
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error uploading material: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to process material. Please try with a different file.'}), 500

@materials_bp.route('', methods=['GET'])
@login_required
def get_user_materials():
    """Get all materials for the current user"""
    try:
        material_service = MaterialService(g.db)
        materials = material_service.get_user_materials(g.user['id'])
        
        result = []
        for mat in materials:
            try:
                result.append({
                    'id': mat.id,
                    'title': mat.title,
                    'description': mat.description,
                    'fileName': os.path.basename(mat.file_path) if mat.file_path else "",
                    'fileType': mat.file_type,
                    'material_type': mat.material_type,
                    'status': mat.embedding_status,
                    'pageCount': mat.page_count,
                    'wordCount': mat.word_count,
                    'author': mat.author,
                    'createdAt': mat.created_at.isoformat() if mat.created_at else None,
                    'updatedAt': mat.updated_at.isoformat() if mat.updated_at else None,
                })
            except Exception as e:
                current_app.logger.error(f"Error processing material {mat.id}: {str(e)}")
                continue
        
        return jsonify({'materials': result})
    except Exception as e:
        current_app.logger.error(f"Error fetching materials: {str(e)}")
        return jsonify({'error': 'Failed to fetch materials'}), 500

@materials_bp.route('/<material_id>', methods=['GET'])
@login_required
def get_material(material_id):
    """Get a specific material"""
    try:
        material_service = MaterialService(g.db)
        material = material_service.get_material(material_id, g.user['id'])
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        # Build metadata from available fields
        metadata = {
            'author': material.author,
            'publicationDate': material.publication_date,
            'topics': material.topics
        }
        
        return jsonify({
            'id': material.id,
            'title': material.title,
            'description': material.description,
            'fileName': os.path.basename(material.file_path) if material.file_path else "",
            'fileType': material.file_type,
            'material_type': material.material_type,
            'status': material.embedding_status,
            'pageCount': material.page_count,
            'wordCount': material.word_count,
            'metadata': metadata,
            'createdAt': material.created_at.isoformat() if material.created_at else None,
            'updatedAt': material.updated_at.isoformat() if material.updated_at else None,
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching material {material_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch material'}), 500
        
@materials_bp.route('/<material_id>', methods=['DELETE'])
@login_required
def delete_material(material_id):
    """Delete a material"""
    try:
        material_service = MaterialService(g.db)
        material = material_service.get_material(material_id, g.user['id'])
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
            
        material_service.delete_material(material_id)
        return jsonify({'message': 'Material deleted successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting material {material_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete material'}), 500

@materials_bp.route('/<material_id>/content', methods=['GET'])
@login_required
def get_material_content(material_id):
    """Get the content of a material"""
    try:
        material_service = MaterialService(g.db)
        material = material_service.get_material(material_id, g.user['id'])
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        # Extract content from file if available
        content = ""
        try:
            if material.file_path and os.path.exists(material.file_path):
                if material.file_type == 'pdf':
                    import PyPDF2
                    with open(material.file_path, 'rb') as file:
                        reader = PyPDF2.PdfReader(file)
                        content = ""
                        for page in reader.pages:
                            content += page.extract_text() + "\n\n"
                elif material.file_type in ['txt', 'md']:
                    with open(material.file_path, 'r', encoding='utf-8') as file:
                        content = file.read()
                elif material.file_type == 'docx':
                    import docx
                    doc = docx.Document(material.file_path)
                    content = "\n".join([para.text for para in doc.paragraphs])
                else:
                    return jsonify({'error': 'File type not supported for content viewing'}), 400
            else:
                return jsonify({'error': 'File not found'}), 404
        except Exception as e:
            current_app.logger.error(f"Error extracting content from {material.file_path}: {str(e)}")
            return jsonify({'error': 'Failed to extract content from file'}), 500
        
        # Build metadata for response
        metadata = {
            'title': material.title,
            'author': material.author,
            'publication_date': material.publication_date,
            'material_type': material.material_type,
            'file_type': material.file_type,
            'page_count': material.page_count,
            'word_count': material.word_count,
            'topics': material.topics,
            'embedding_status': material.embedding_status
        }
        
        return jsonify({
            'content': content,
            'metadata': metadata
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching material content {material_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch material content'}), 500

@materials_bp.route('/<material_id>/file', methods=['GET'])
@login_required
def get_material_file(material_id):
    """Get the original file of a material"""
    try:
        material_service = MaterialService(g.db)
        material = material_service.get_material(material_id, g.user['id'])
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
            
        if not material.file_path or not os.path.exists(material.file_path):
            return jsonify({'error': 'File not found'}), 404
            
        return send_file(material.file_path, as_attachment=True)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching material file {material_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch material file'}), 500
        
@materials_bp.route('/<material_id>/process', methods=['POST'])
@login_required
def process_material(material_id):
    """Process or reprocess a material into the vector database"""
    try:
        # Get the material
        material_service = MaterialService(g.db, vector_service, text_processor)
        material = material_service.get_material(material_id, g.user['id'])
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
            
        # Check if file exists
        if not material.file_path or not os.path.exists(material.file_path):
            return jsonify({'error': 'Material file not found'}), 404
        
        # Process the material for vector storage
        result = material_service.process_material_for_vectors(material)
        
        if not result:
            return jsonify({'error': 'Failed to process material'}), 500
            
        return jsonify({
            'message': 'Material processing started',
            'status': material.embedding_status
        })
        
    except Exception as e:
        current_app.logger.error(f"Error processing material {material_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to process material'}), 500 