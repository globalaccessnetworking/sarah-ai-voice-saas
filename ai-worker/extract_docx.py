import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text(docx_path):
    try:
        z = zipfile.ZipFile(docx_path)
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = tree.findall('.//w:p', ns)
        text = []
        for p in paragraphs:
            texts = p.findall('.//w:t', ns)
            if texts:
                p_text = ''.join([t.text for t in texts if t.text])
                text.append(p_text)
        
        return '\n'.join(text)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    path = r'd:\AI AGENT SUTHRA PUNJAB\livekit-dashboard\DOCS\RoboCallBrainstorming.docx'
    content = extract_text(path)
    with open('brainstorming_content.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Extracted to brainstorming_content.txt")
