export const parseExcelFile = async (file: File): Promise<any[][]> => {
    try {
        const { default: readXlsxFile } = await import('read-excel-file');
        const rows = await readXlsxFile(file);
        if (!rows || rows.length === 0) {
            throw new Error("הקובץ ריק");
        }
        return rows as any[][];
    } catch (err) {
        console.error('Excel parsing error:', err);
        throw err;
    }
};
