import re

def clean_file(path):
    with open(path, 'r') as f:
        lines = f.readlines()
    
    with open(path, 'w') as f:
        for line in lines:
            if 'setOwnerFilter("all");' in line or 'setOwnerFilter(\'all\');' in line:
                if not re.search(r'(setSortBy|setWebinarFilter|onClearAll)', line):
                    continue
            
            # Remove rogue commas/fragments
            if line.strip() == ',' or line.strip() == 'setOwnerFilter("all");':
                continue
                
            f.write(line)

clean_file('src/pages/admin/content/InvestorLeadsAdmin.tsx')
clean_file('src/pages/admin/content/WebinarLeadsAdmin.tsx')
