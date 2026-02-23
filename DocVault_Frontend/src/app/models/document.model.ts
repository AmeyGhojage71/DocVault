export interface Document {
    id: string;
    userId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    uploadedAt: string;
    tags: string[];
    excerpt: string;
    thumbnailUrl: string;
    status: 'pending' | 'processed' | 'failed';
    downloadUrl: string; // SAS URL — never a raw blob URL
}

export interface DocumentListResponse {
    items: Document[];
    count: number;
}

export interface SearchResult {
    items: Document[];
    totalCount: number;
    query: string;
}

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}
