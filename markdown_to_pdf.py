import re
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, HRFlowable
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib import colors


class MarkdownToPDF:
    def __init__(self, markdown_file, pdf_file, title=None):
        self.markdown_file = markdown_file
        self.pdf_file = pdf_file
        self.title = title or "Markdown to PDF Document"
        self.styles = self._create_styles()
        self.elements = []
        self.in_code_block = False
        self.code_block_content = []
        
    def _create_styles(self):
        """Create custom styles for various markdown elements"""
        styles = getSampleStyleSheet()
        
        # Custom heading styles
        styles.add(ParagraphStyle(
            name='CustomHeading1',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#1f4788'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=styles['Heading2'],
            fontSize=20,
            textColor=colors.HexColor('#2e5c8a'),
            spaceAfter=10,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='CustomHeading3',
            parent=styles['Heading3'],
            fontSize=16,
            textColor=colors.HexColor('#3d6b8c'),
            spaceAfter=8,
            spaceBefore=8,
            fontName='Helvetica-Bold'
        ))
        
        # Normal paragraph style with better spacing
        styles.add(ParagraphStyle(
            name='CustomBody',
            parent=styles['BodyText'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
            leading=14
        ))
        
        # Code style
        styles.add(ParagraphStyle(
            name='CustomCode',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=9,
            textColor=colors.HexColor('#d63384'),
            backColor=colors.HexColor('#f8f9fa'),
            borderColor=colors.HexColor('#dee2e6'),
            borderWidth=0.5,
            borderPadding=4
        ))
        
        # Code block style
        styles.add(ParagraphStyle(
            name='CodeBlock',
            fontName='Courier',
            fontSize=8,
            textColor=colors.HexColor('#212529'),
            backColor=colors.HexColor('#f4f4f4'),
            borderColor=colors.HexColor('#cccccc'),
            borderWidth=1,
            borderPadding=10,
            leftIndent=20,
            rightIndent=20,
            spaceAfter=10,
            spaceBefore=10
        ))
        
        # List item style
        styles.add(ParagraphStyle(
            name='ListItem',
            parent=styles['BodyText'],
            fontSize=11,
            leftIndent=30,
            spaceAfter=4,
            leading=14
        ))
        
        return styles
    
    def _escape_special_chars(self, text):
        """Escape special characters for reportlab"""
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        return text
    
    def _convert_inline_formatting(self, text):
        """Convert inline markdown formatting to reportlab XML tags using placeholder shielding"""
        text = self._escape_special_chars(text)
        
        # 1. Convert [link](url) to <u>link text</u> first to discard URL and keep link text
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<u>\1</u>', text)
        
        # 2. Extract and shield inline `code` blocks
        code_placeholders = []
        def shield_code(match):
            code_content = match.group(1)
            # The code content shouldn't be processed for bold/italic, so it's safe inside placeholder
            formatted_code = f'<font color="#d63384"><b>{code_content}</b></font>'
            placeholder = f'___CODE_PLACEHOLDER_{len(code_placeholders)}___'
            code_placeholders.append((placeholder, formatted_code))
            return placeholder
        
        text = re.sub(r'`([^`]+)`', shield_code, text)
        
        # 3. Apply **bold** and __bold__ formatting with flanking rules
        text = re.sub(r'(?<!\w)\*\*(?!\s)(.+?)(?<!\s)\*\*(?!\w)', r'<b>\1</b>', text)
        text = re.sub(r'(?<!\w)__(?!\s)(.+?)(?<!\s)__(?!\w)', r'<b>\1</b>', text)
        
        # 4. Apply *italic* and _italic_ formatting with flanking rules
        text = re.sub(r'(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)', r'<i>\1</i>', text)
        text = re.sub(r'(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)', r'<i>\1</i>', text)
        
        # 5. Restore the shielded code blocks
        for placeholder, formatted_code in code_placeholders:
            text = text.replace(placeholder, formatted_code)
            
        return text
    
    def _process_line(self, line):
        """Process a single line of markdown"""
        line = line.rstrip()
        
        if not line:  # Empty line
            self.elements.append(Spacer(1, 0.1 * inch))
            return
        
        # Check for heading
        match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if match:
            level = len(match.group(1))
            text = match.group(2)
            text = self._convert_inline_formatting(text)
            
            if level == 1:
                self.elements.append(Paragraph(text, self.styles['CustomHeading1']))
                self.elements.append(Spacer(1, 0.15 * inch))
            elif level == 2:
                self.elements.append(Paragraph(text, self.styles['CustomHeading2']))
                self.elements.append(Spacer(1, 0.1 * inch))
            elif level == 3:
                self.elements.append(Paragraph(text, self.styles['CustomHeading3']))
                self.elements.append(Spacer(1, 0.08 * inch))
            else:
                self.elements.append(Paragraph(text, self.styles['Heading4']))
                self.elements.append(Spacer(1, 0.05 * inch))
            return
        
        # Check for code block start
        if line.strip().startswith('```'):
            if self.in_code_block:
                # End code block
                self.in_code_block = False
                code_text = '\n'.join(self.code_block_content)
                code_text = self._escape_special_chars(code_text)
                self.elements.append(Preformatted(code_text, self.styles['CodeBlock']))
                self.elements.append(Spacer(1, 0.1 * inch))
                self.code_block_content = []
            else:
                # Start code block
                self.in_code_block = True
            return
        
        # If in code block, collect content
        if self.in_code_block:
            self.code_block_content.append(line)
            return
        
        # Check for list items
        if re.match(r'^[\s]*[-*+]\s+', line):
            match = re.match(r'^[\s]*([-*+])\s+(.+)$', line)
            if match:
                text = match.group(2)
                text = self._convert_inline_formatting(text)
                self.elements.append(Paragraph('• ' + text, self.styles['ListItem']))
            return
        
        # Check for horizontal rule
        if re.match(r'^(\s*[-_*]){3,}\s*$', line):
            self.elements.append(Spacer(1, 0.1 * inch))
            self.elements.append(HRFlowable(width="80%", thickness=1, color=colors.grey))
            self.elements.append(Spacer(1, 0.1 * inch))
            return
        
        # Regular paragraph
        text = self._convert_inline_formatting(line)
        self.elements.append(Paragraph(text, self.styles['CustomBody']))
    
    def convert(self):
        """Convert markdown file to PDF"""
        # Read markdown file
        with open(self.markdown_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Process each line
        for line in lines:
            self._process_line(line)
        
        # Handle any remaining code block
        if self.in_code_block and self.code_block_content:
            code_text = '\n'.join(self.code_block_content)
            code_text = self._escape_special_chars(code_text)
            self.elements.append(Preformatted(code_text, self.styles['CodeBlock']))
        
        # Create PDF document
        doc = SimpleDocTemplate(
            self.pdf_file,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
            title=self.title
        )
        
        # Build PDF
        doc.build(self.elements)
        print(f"✅ PDF created successfully at: {self.pdf_file}")
        return True


import os
import sys


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    if len(sys.argv) > 2:
        markdown_file = sys.argv[1]
        pdf_file = sys.argv[2]
    else:
        markdown_file = os.path.join(base_dir, "BACKEND_DEEP_DIVE.md")
        pdf_file = os.path.join(base_dir, "BACKEND_DEEP_DIVE.pdf")
        
    if not os.path.isabs(markdown_file):
        markdown_file = os.path.join(base_dir, markdown_file)
    if not os.path.isabs(pdf_file):
        pdf_file = os.path.join(base_dir, pdf_file)
    
    # Make sure we use a clean title for custom PDFs
    title = os.path.splitext(os.path.basename(pdf_file))[0].replace('_', ' ').title()
    
    converter = MarkdownToPDF(markdown_file, pdf_file, title=title)
    converter.convert()


if __name__ == "__main__":
    main()
