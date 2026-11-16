#!/usr/bin/env python3
"""Import cached Excel values; never execute formulas or follow workbook links."""
import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from zipfile import ZipFile
import openpyxl

KEYS = ['provider', 'product', 'minPv', 'pvRate', 'profitRate', 'ownership', 'vatRate', 'finResult']
LABELS = ['КЭС', 'Продукт', 'MIN ПВ', 'ПВ,%', 'К приб,%', 'Доля владения,%', 'НДС,%', 'ФинРез']

def display(value, money=False):
    number = Decimal(str(value)) * (1 if money else 100)
    text = format(number.quantize(Decimal('0.01') if money else Decimal('0.000001')), 'f').rstrip('0').rstrip('.')
    if money:
        whole, _, fraction = text.partition('.')
        text = f'{int(whole or 0):,}'.replace(',', '\u00a0') + (',' + fraction if fraction else '')
    else:
        text = text.replace('.', ',')
    return text + (' ₽' if money else ' %')

def import_workbook(source, output):
    with ZipFile(source) as archive:
        if sum(info.file_size for info in archive.infolist()) > 64 * 1024 * 1024:
            raise ValueError('Распакованный файл слишком большой')
    values = openpyxl.load_workbook(source, data_only=True, keep_links=False)
    formulas = openpyxl.load_workbook(source, data_only=False, keep_links=False)
    records, sheets = [], []
    for sheet_index, sheet in enumerate(values.worksheets, 1):
        if sheet.max_row > 5000 or len(values.worksheets) > 10:
            raise ValueError('Превышен лимит строк или листов')
        header = [str(sheet.cell(1, c).value or '').strip() for c in range(1, 9)]
        if header != LABELS:
            raise ValueError(f'Неожиданные заголовки на листе {sheet.title}; проверьте A1:H1')
        sheets.append(sheet.title)
        for row in range(2, sheet.max_row + 1):
            cells = [sheet.cell(row, col) for col in range(1, 9)]
            if all(cell.value is None for cell in cells):
                continue
            if not all(isinstance(cell.value, str) and cell.value.strip() for cell in cells[:2]):
                raise ValueError(f'Нет компании или продукта: {sheet.title}!A{row}:B{row}')
            if any(not isinstance(cell.value, (int, float)) or isinstance(cell.value, bool) for cell in cells[2:]):
                raise ValueError(f'Нет сохранённых числовых значений: {sheet.title}!C{row}:H{row}')
            fields = {}
            for col, (key, label) in enumerate(zip(KEYS[2:], LABELS[2:]), 3):
                cell = sheet.cell(row, col)
                formula = formulas[sheet.title].cell(row, col).value
                fields[key] = {'label': label, 'value': cell.value, 'display': display(cell.value, key == 'minPv'),
                               'cell': cell.coordinate, 'formula': formula if isinstance(formula, str) and formula.startswith('=') else None}
            records.append({'id': f's{sheet_index}-r{row}', 'sheet': sheet.title, 'row': row,
                            'range': f'A{row}:H{row}', 'provider': cells[0].value.strip(),
                            'product': cells[1].value.strip(), 'fields': fields})
    if not records:
        raise ValueError('В файле нет данных')
    knowledge = {'schemaVersion': 1, 'filename': source.name,
                 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                 'importedAt': datetime.now(timezone.utc).isoformat(), 'sheets': sheets,
                 'headers': dict(zip(KEYS, LABELS)), 'records': records,
                 'notes': ['Использованы сохранённые в Excel значения; внешние формулы не пересчитывались.',
                           'Дата действия условий и правило применения MIN ПВ в файле не указаны.']}
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix('.tmp')
    temp.write_text(json.dumps(knowledge, ensure_ascii=False, indent=2), encoding='utf-8')
    os.chmod(temp, 0o600)
    temp.replace(output)
    print(f'Импортировано {len(records)} строк, {len(set(r["provider"] for r in records))} компаний, '
          f'{len(set((r["provider"], r["product"]) for r in records))} продуктов. База: {output}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('workbook', type=Path)
    parser.add_argument('--output', type=Path, default=Path('server/private/kv-knowledge.json'))
    args = parser.parse_args()
    import_workbook(args.workbook, args.output)
