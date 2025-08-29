// Configuration
const API_BASE_URL = 'https://your-render-app.onrender.com'; // Replace with your Render backend URL

class YouTubeDownloader {
    constructor() {
        this.form = document.getElementById('downloadForm');
        this.urlInput = document.getElementById('videoUrl');
        this.qualitySelect = document.getElementById('qualitySelect');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.thumbnailBtn = document.getElementById('thumbnailBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        this.progressFill = document.getElementById('progressFill');
        this.successContainer = document.getElementById('successContainer');
        this.errorContainer = document.getElementById('errorContainer');
        this.downloadLink = document.getElementById('downloadLink');
        this.downloadedFileName = document.getElementById('downloadedFileName');
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');

        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleDownload(e));
        this.thumbnailBtn.addEventListener('click', () => this.handleThumbnailDownload());
        this.retryBtn.addEventListener('click', () => this.resetForm());
        this.urlInput.addEventListener('input', () => this.validateUrl());
    }

    validateUrl() {
        const url = this.urlInput.value.trim();
        const isValid = url.includes('youtube.com') || url.includes('youtu.be');
        
        if (url && !isValid) {
            this.urlInput.style.borderColor = '#ff416c';
        } else {
            this.urlInput.style.borderColor = '#e1e5e9';
        }
        
        return isValid || !url;
    }

    async handleDownload(e) {
        e.preventDefault();
        
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showError('Please enter a YouTube URL');
            return;
        }

        if (!this.validateUrl()) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }

        this.startDownload(url);
    }

    async startDownload(url) {
        this.hideAllContainers();
        this.showProgress();
        this.setButtonLoading(true);

        const quality = this.qualitySelect.value;
        const qualityText = this.qualitySelect.options[this.qualitySelect.selectedIndex].text;

        try {
            const response = await fetch(`${API_BASE_URL}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, quality })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.handleStreamResponse(response, qualityText);

        } catch (error) {
            console.error('Download error:', error);
            this.showError('Failed to start download. Please check your connection and try again.');
            this.setButtonLoading(false);
        }
    }

    async handleStreamResponse(response, qualityText) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { value, done } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        this.handleDownloadUpdate(data, qualityText);
                    } catch (e) {
                        console.log('Non-JSON line:', line);
                    }
                }
            }
        } catch (error) {
            console.error('Stream reading error:', error);
            this.showError('Connection lost during download. Please try again.');
        } finally {
            this.setButtonLoading(false);
        }
    }

    handleDownloadUpdate(data, qualityText) {
        switch (data.status) {
            case 'started':
                this.updateProgress(`Starting ${qualityText} download...`, 10);
                break;
            case 'progress':
                this.updateProgress(data.message || 'Downloading...', data.percent || 50);
                break;
            case 'completed':
                this.updateProgress('Download completed!', 100);
                setTimeout(() => {
                    this.showSuccess(data.filename, `${API_BASE_URL}${data.downloadUrl}`, qualityText);
                }, 500);
                break;
            case 'error':
                this.showError(data.message || 'Download failed');
                break;
        }
    }

    showProgress() {
        this.progressContainer.classList.remove('hidden');
        this.updateProgress('Preparing download...', 0);
    }

    updateProgress(text, percent) {
        this.progressText.textContent = text;
        this.progressPercent.textContent = `${Math.round(percent)}%`;
        this.progressFill.style.width = `${percent}%`;
    }

    showSuccess(filename, downloadUrl, qualityText) {
        this.hideAllContainers();
        this.successContainer.classList.remove('hidden');
        this.downloadedFileName.textContent = `Downloaded: ${filename} (${qualityText})`;
        this.downloadLink.href = downloadUrl;
        this.downloadLink.download = filename;
        
        // Auto-trigger download
        setTimeout(() => {
            this.downloadLink.click();
        }, 1000);
    }

    async handleThumbnailDownload() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showError('Please enter a YouTube URL first');
            return;
        }

        if (!this.validateUrl()) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }

        this.startThumbnailDownload(url);
    }

    async startThumbnailDownload(url) {
        this.hideAllContainers();
        this.showProgress();
        this.setThumbnailButtonLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/download-thumbnail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.handleThumbnailStreamResponse(response);

        } catch (error) {
            console.error('Thumbnail download error:', error);
            this.showError('Failed to start thumbnail download. Please check your connection and try again.');
            this.setThumbnailButtonLoading(false);
        }
    }

    async handleThumbnailStreamResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { value, done } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        this.handleThumbnailDownloadUpdate(data);
                    } catch (e) {
                        console.log('Non-JSON line:', line);
                    }
                }
            }
        } catch (error) {
            console.error('Thumbnail stream reading error:', error);
            this.showError('Connection lost during thumbnail download. Please try again.');
        } finally {
            this.setThumbnailButtonLoading(false);
        }
    }

    handleThumbnailDownloadUpdate(data) {
        switch (data.status) {
            case 'started':
                this.updateProgress('Starting thumbnail download...', 10);
                break;
            case 'progress':
                this.updateProgress(data.message || 'Downloading thumbnail...', data.percent || 50);
                break;
            case 'completed':
                this.updateProgress('Thumbnail download completed!', 100);
                setTimeout(() => {
                    this.showThumbnailSuccess(data.filename, `${API_BASE_URL}${data.downloadUrl}`);
                }, 500);
                break;
            case 'error':
                this.showError(data.message || 'Thumbnail download failed');
                break;
        }
    }

    showThumbnailSuccess(filename, downloadUrl) {
        this.hideAllContainers();
        this.successContainer.classList.remove('hidden');
        this.downloadedFileName.textContent = `Downloaded: ${filename} (Thumbnail)`;
        this.downloadLink.href = downloadUrl;
        this.downloadLink.download = filename;
        
        // Auto-trigger download
        setTimeout(() => {
            this.downloadLink.click();
        }, 1000);
    }

    showError(message) {
        this.hideAllContainers();
        this.errorContainer.classList.remove('hidden');
        this.errorMessage.textContent = message;
        this.setButtonLoading(false);
    }

    hideAllContainers() {
        this.progressContainer.classList.add('hidden');
        this.successContainer.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
    }

    setButtonLoading(loading) {
        if (loading) {
            this.downloadBtn.disabled = true;
            this.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            this.downloadBtn.classList.add('loading');
        } else {
            this.downloadBtn.disabled = false;
            this.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Video';
            this.downloadBtn.classList.remove('loading');
        }
    }

    setThumbnailButtonLoading(loading) {
        if (loading) {
            this.thumbnailBtn.disabled = true;
            this.thumbnailBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            this.thumbnailBtn.classList.add('loading');
        } else {
            this.thumbnailBtn.disabled = false;
            this.thumbnailBtn.innerHTML = '<i class="fas fa-image"></i> Download Thumbnail';
            this.thumbnailBtn.classList.remove('loading');
        }
    }

    resetForm() {
        this.hideAllContainers();
        this.urlInput.value = '';
        this.setButtonLoading(false);
        this.setThumbnailButtonLoading(false);
        this.urlInput.focus();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeDownloader();
    
    // Add some nice animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    document.querySelectorAll('.feature').forEach(feature => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(20px)';
        feature.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(feature);
    });
});