import os,subprocess,shutil,json,xlrd

def do(cmd, cwd=None):
    p = subprocess.Popen(cmd,shell=True,cwd=cwd)
    p.wait()
    return p.returncode

def saveToJson(xl,type):
    table = xl.sheet_by_name(type)
    game_list = []
    for r in range(1,table.nrows):
        if table.cell_value(r, 0) == '':
            continue
        values = {}
        try:
            values['aid'] = str(int(table.cell_value(r, 0)))
            values['flag'] = values['aid']
            values['title'] = str(table.cell_value(r, 1))
            values['litpic'] = "/game_logo/%s.jpg"%values['flag']
            values['is_news'] = 0
            values['gamesize'] = str(table.cell_value(r, 2))
            if (values['gamesize'].endswith('.0')):
                values['gamesize'] = values['gamesize'][:-2]
            values['gametype'] = ''
            values['language'] = str(table.cell_value(r, 3))
            print(type,values)
            game_list.append(values)
        except Exception as e:
            print(e)
    fn = 'game_list_data_%s.json'%type
    with open(fn,'w+',encoding='utf8') as f:
        f.write(json.dumps({
            'game_list':game_list
        },ensure_ascii=False))
    dist_path = '/home/www/game_select_%s/api/game_list_data_%s.json'%(type,type)
    shutil.move(fn,dist_path)

upload_file_path = os.path.join(os.getenv('WORKSPACE'),'FILE')
xl = xlrd.open_workbook(upload_file_path)
saveToJson(xl,'switch')
saveToJson(xl,'ps4')
saveToJson(xl,'ps5')
