const iconModules = import.meta.glob("./*.tsx", { eager: true });

export const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {};

Object.entries(iconModules).forEach(([filePath, module]) => {
    const match = filePath.match(/\.\/(\w+)\.tsx$/);
    if(!match) return;
    const rawName = match[1].toLowerCase();     // 转成小写
    iconMap[rawName] = (module as any).default;
});


export default iconMap;