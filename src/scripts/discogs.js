export class DiscogsClient {
    constructor() {
        this.baseUrl = 'https://api.discogs.com';
    }

    async fetchUserLists(username) {
        // try to fetch user lists
        const url = `${this.baseUrl}/users/${username}/lists`;
        return this._fetch(url);
    }

    async fetchListItems(listId) {
        const url = `${this.baseUrl}/lists/${listId}`;
        return this._fetch(url);
    }

    async _fetch(url) {
        const headers = {
            'User-Agent': 'CrateDigger/1.0',
        };

        // Check if we have a token stored
        const token = import.meta.env.DISCOGS_TOKEN;
        if (token) {
            headers['Authorization'] = `Discogs token=${token}`;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`Discogs API Error: ${response.statusText}`);
        }
        return response.json();
    }

    mapListToRecords(listData) {
        if (!listData || !listData.items) return [];

        return listData.items.map(item => {
            // API structure for list items
            // item usually has { id, resource_url, uri, display_title, image_url, type: 'release' }
            // The 'display_title' is often "Artist - Title"

            let artist = 'Unknown Artist';
            let title = 'Unknown Title';

            if (item.display_title) {
                const parts = item.display_title.split(' - ');
                if (parts.length >= 2) {
                    artist = parts[0];
                    title = parts.slice(1).join(' - ');
                } else {
                    title = item.display_title;
                }
            }

            let coverUrl = item.image_url || '';
            if (coverUrl) {
                // Use our local proxy to avoid CORS
                // URL format: https://i.discogs.com/xyz...
                // We want: /img-proxy/xyz...
                coverUrl = coverUrl.replace('https://i.discogs.com', '/img-proxy');
            }

            return {
                id: item.id.toString(),
                title: title,
                artist: artist,
                cover: coverUrl,
                year: item.year || '',
                hasSleeve: false
            };
        });
    }

    async fetchCollection(username) {
        // defaults to folder 0 (All)
        const url = `${this.baseUrl}/users/${username}/collection/folders/0/releases?per_page=50&sort=added&sort_order=desc`;
        const data = await this._fetch(url);

        // Collection structure is different: data.releases[].basic_information
        if (!data || !data.releases) return [];

        return data.releases.map(item => {
            const info = item.basic_information;

            let coverUrl = info.cover_image || info.thumb || '';
            if (coverUrl) {
                coverUrl = coverUrl.replace('https://i.discogs.com', '/img-proxy');
            }

            return {
                id: item.id.toString(),
                title: info.title,
                artist: info.artists && info.artists.length > 0 ? info.artists[0].name : 'Unknown',
                cover: coverUrl,
                year: info.year || '',
                hasSleeve: false
            };
        });
    }
}
