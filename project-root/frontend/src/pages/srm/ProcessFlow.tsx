/* Страница «Процесс МТО»: блок-схема закупочного процесса + таблица ответственных. */

type NodeKind = 'process' | 'decision' | 'final' | 'loop';

interface RectNode {
  kind: Exclude<NodeKind, 'decision'>;
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
}

interface DecisionNode {
  kind: 'decision';
  cx: number;
  cy: number;
  hw: number; // половина ширины ромба
  hh: number; // половина высоты ромба
  lines: string[];
}

const RECT_NODES: RectNode[] = [
  // Основная цепочка (центр x=430)
  { kind: 'process', x: 310, y: 16, w: 240, h: 46, lines: ['Потребность в МТО'] },
  { kind: 'process', x: 310, y: 92, w: 240, h: 46, lines: ['Заявка на закупку'] },
  { kind: 'process', x: 310, y: 260, w: 240, h: 52, lines: ['Проверка остатков', 'на складе'] },
  { kind: 'process', x: 310, y: 428, w: 240, h: 46, lines: ['Запрос цен / выбор поставщика'] },
  { kind: 'process', x: 310, y: 504, w: 240, h: 46, lines: ['Заказ поставщику'] },
  { kind: 'process', x: 310, y: 580, w: 240, h: 46, lines: ['Счет от поставщика'] },
  { kind: 'process', x: 310, y: 752, w: 240, h: 46, lines: ['Оплата счета'] },
  { kind: 'process', x: 310, y: 828, w: 240, h: 46, lines: ['Поставка МТО'] },
  { kind: 'process', x: 310, y: 904, w: 240, h: 52, lines: ['Приемка: количество,', 'качество, комплектность'] },
  { kind: 'process', x: 310, y: 1076, w: 240, h: 46, lines: ['Поступление на склад'] },
  { kind: 'process', x: 310, y: 1152, w: 240, h: 52, lines: ['УПД / накладная /', 'счет-фактура / акт'] },
  { kind: 'final', x: 310, y: 1228, w: 240, h: 46, lines: ['Потребность обеспечена'] },
  // Правая ветка: выдача со склада
  { kind: 'process', x: 700, y: 336, w: 224, h: 52, lines: ['Выдача со склада /', 'внутреннее перемещение'] },
  // Левые ветки: возвраты на доработку
  { kind: 'loop', x: 16, y: 174, w: 224, h: 52, lines: ['Возврат инициатору', 'на доработку'] },
  { kind: 'loop', x: 16, y: 662, w: 224, h: 52, lines: ['Корректировка заказа', 'или условий'] },
  { kind: 'loop', x: 16, y: 986, w: 224, h: 52, lines: ['Акт расхождений /', 'рекламация поставщику'] },
  { kind: 'loop', x: 16, y: 1062, w: 224, h: 46, lines: ['Замена, допоставка', 'или возврат'] },
];

const DECISIONS: DecisionNode[] = [
  { kind: 'decision', cx: 430, cy: 200, hw: 130, hh: 32, lines: ['Заявка согласована?'] },
  { kind: 'decision', cx: 430, cy: 368, hw: 130, hh: 32, lines: ['Есть нужный остаток?'] },
  { kind: 'decision', cx: 430, cy: 688, hw: 135, hh: 36, lines: ['Условия оплаты', 'согласованы?'] },
  { kind: 'decision', cx: 430, cy: 1012, hw: 130, hh: 32, lines: ['Приемка пройдена?'] },
];

interface Edge {
  d: string;
  loop?: boolean;
  label?: string;
  labelX?: number;
  labelY?: number;
  yes?: boolean; // true — «Да» (зелёный), false — «Нет» (красный)
}

const EDGES: Edge[] = [
  { d: 'M430,62 V88' },
  { d: 'M430,138 V164' },
  { d: 'M430,232 V256', label: 'Да', labelX: 444, labelY: 248, yes: true },
  { d: 'M300,200 H244', label: 'Нет', labelX: 262, labelY: 192, yes: false },
  { d: 'M128,174 V115 H306', loop: true },
  { d: 'M430,312 V332' },
  { d: 'M560,368 H696', label: 'Да', labelX: 606, labelY: 360, yes: true },
  { d: 'M812,388 V1251 H554' },
  { d: 'M430,400 V424', label: 'Нет', labelX: 444, labelY: 416, yes: false },
  { d: 'M430,474 V500' },
  { d: 'M430,550 V576' },
  { d: 'M430,626 V648' },
  { d: 'M295,688 H244', label: 'Нет', labelX: 258, labelY: 680, yes: false },
  { d: 'M128,662 V527 H306', loop: true },
  { d: 'M430,724 V748', label: 'Да', labelX: 444, labelY: 740, yes: true },
  { d: 'M430,798 V824' },
  { d: 'M430,874 V900' },
  { d: 'M430,956 V976' },
  { d: 'M300,1012 H244', label: 'Нет', labelX: 262, labelY: 1004, yes: false },
  { d: 'M128,1038 V1058', loop: true },
  { d: 'M240,1085 H272 V930 H306', loop: true },
  { d: 'M430,1044 V1072', label: 'Да', labelX: 444, labelY: 1064, yes: true },
  { d: 'M430,1122 V1148' },
  { d: 'M430,1204 V1224' },
];

const RECT_STYLE: Record<RectNode['kind'], { fill: string; stroke: string }> = {
  process: { fill: 'var(--bg-surface)', stroke: 'var(--border-default)' },
  final: { fill: 'color-mix(in srgb, var(--success) 12%, var(--bg-surface))', stroke: 'var(--success)' },
  loop: { fill: 'color-mix(in srgb, var(--error) 6%, var(--bg-surface))', stroke: 'var(--error)' },
};

const RESPONSIBILITY_TABLE: { stage: string; who: string; result: string }[] = [
  { stage: 'Потребность', who: 'Инициатор: производство, участок, отдел', result: 'Обоснование потребности в материалах, оборудовании или услугах' },
  { stage: 'Заявка', who: 'Инициатор и руководитель', result: 'Согласованная заявка с номенклатурой, количеством, сроком и статьей затрат' },
  { stage: 'Выбор поставщика', who: 'Снабжение / закупки', result: 'Коммерческие предложения, сравнение условий, выбранный поставщик' },
  { stage: 'Заказ', who: 'Снабжение', result: 'Заказ поставщику с ценой, сроками, адресом и условиями поставки' },
  { stage: 'Счет и оплата', who: 'Поставщик, бухгалтерия, финансы', result: 'Счет и подтверждение оплаты' },
  { stage: 'Поставка и приемка', who: 'Склад, МТО, инициатор', result: 'Поступление, накладная/УПД, приемочный документ' },
  { stage: 'Закрытие', who: 'Бухгалтерия, склад', result: 'Оприходованные МТО и закрывающие документы' },
];

function NodeText({ cx, cy, lines }: { cx: number; cy: number; lines: string[] }) {
  const lineHeight = 14;
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  return (
    <text
      x={cx}
      y={startY}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fill="var(--text-primary)"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={cx} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export default function ProcessFlowPage() {
  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div>
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Процесс МТО</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Сквозной процесс обеспечения материально-техническими ресурсами
        </p>
      </div>

      <div className="rounded-xl border p-4 overflow-x-auto" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <svg viewBox="0 0 940 1300" className="min-w-[720px] w-full max-w-4xl mx-auto" role="img" aria-label="Блок-схема процесса МТО">
          <defs>
            <marker id="mto-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--text-tertiary)" />
            </marker>
            <marker id="mto-arrow-loop" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--error)" />
            </marker>
          </defs>

          {EDGES.map((e, i) => (
            <g key={i}>
              <path
                d={e.d}
                fill="none"
                stroke={e.loop ? 'var(--error)' : 'var(--text-tertiary)'}
                strokeWidth={1.5}
                strokeDasharray={e.loop ? '5 4' : undefined}
                markerEnd={e.loop ? 'url(#mto-arrow-loop)' : 'url(#mto-arrow)'}
              />
              {e.label && (
                <text
                  x={e.labelX}
                  y={e.labelY}
                  fontSize={11}
                  fontWeight={600}
                  fill={e.yes ? 'var(--success)' : 'var(--error)'}
                >
                  {e.label}
                </text>
              )}
            </g>
          ))}

          {RECT_NODES.map((n, i) => {
            const style = RECT_STYLE[n.kind];
            return (
              <g key={i}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={8}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={1.5}
                />
                <NodeText cx={n.x + n.w / 2} cy={n.y + n.h / 2} lines={n.lines} />
              </g>
            );
          })}

          {DECISIONS.map((d, i) => (
            <g key={i}>
              <polygon
                points={`${d.cx},${d.cy - d.hh} ${d.cx + d.hw},${d.cy} ${d.cx},${d.cy + d.hh} ${d.cx - d.hw},${d.cy}`}
                fill="color-mix(in srgb, var(--warning) 12%, var(--bg-surface))"
                stroke="var(--warning)"
                strokeWidth={1.5}
              />
              <NodeText cx={d.cx} cy={d.cy} lines={d.lines} />
            </g>
          ))}
        </svg>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface-2)' }}>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Этап</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Кто отвечает</th>
              <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Основной результат</th>
            </tr>
          </thead>
          <tbody>
            {RESPONSIBILITY_TABLE.map((row) => (
              <tr key={row.stage} className="border-t" style={{ borderColor: 'var(--border-default)' }}>
                <td className="px-4 py-2.5 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{row.stage}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{row.who}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
