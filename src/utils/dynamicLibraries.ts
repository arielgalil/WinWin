/**
 * Utility for dynamic loading of heavy external libraries.
 * This ensures that these libraries are only downloaded when their functionality is actually requested.
 */

/**
 * Dynamically loads html2canvas and returns the library instance.
 * @returns {Promise<any>} The html2canvas library.
 */
export async function loadHtml2Canvas(): Promise<any> {
    const module = await import("html2canvas");
    return module.default || module;
}

/**
 * Dynamically loads read-excel-file and returns the library instance.
 * @returns {Promise<any>} The readXlsxFile function.
 */
export async function loadReadExcelFile(): Promise<any> {
    // Note: read-excel-file often exports its main function as default or named
    const module = await import("read-excel-file");
    return module.default || module;
}
