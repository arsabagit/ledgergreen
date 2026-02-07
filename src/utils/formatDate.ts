export const formatDate = (dateStr: string, format: string = 'DD-MMM-YYYY') => {
    try {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const monthIndex = date.getMonth();
        const monthNum = (monthIndex + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthName = monthNames[monthIndex];

        if (format === 'DD-MM-YYYY') {
            return `${day}-${monthNum}-${year}`;
        } else if (format === 'MM/DD/YYYY') {
            return `${monthNum}/${day}/${year}`;
        } else if (format === 'YYYY-MM-DD') {
            return `${year}-${monthNum}-${day}`;
        } else {
            // Default DD-MMM-YYYY
            return `${day}-${monthName}-${year}`;
        }
    } catch (e) {
        return dateStr;
    }
};
