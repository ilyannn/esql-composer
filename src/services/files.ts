import axios from "axios";

export const loadFile = async (url: string | null) => {
    if (!url) {
        return "";
    }
    const response = await axios.get(url);
    return response.data;
}