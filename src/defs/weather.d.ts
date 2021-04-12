interface WeatherJSOptions {
    search: string;
    lang?: string;
    degreeType?: string;
    timeout?: number;
}

interface WeatherJSResult {
    location: {
        name: string;
        lat: string;
        long: string;
        timezone: string;
        alert: string;
        degreetype: string;
        imagerelativeurl: string;
    };
    current: {
        temperature: string;
        skycode: string;
        skytext: string;
        date: string;
        observationtime: string;
        observationpoint: string;
        feelslike: string;
        humidity: string;
        winddisplay: string;
        day: string;
        shortday: string;
        windspeed: string;
        imageUrl: string;
    };
    forecast: [
        {
            low: string;
            high: string;
            skycodeday: string;
            skytextday: string;
            date: string;
            day: string;
            shortday: string;
            precip: string;
        },
        {
            low: string;
            high: string;
            skycodeday: string;
            skytextday: string;
            date: string;
            day: string;
            shortday: string;
            precip: string;
        },
        {
            low: string;
            high: string;
            skycodeday: string;
            skytextday: string;
            date: string;
            day: string;
            shortday: string;
            precip: string;
        },
        {
            low: string;
            high: string;
            skycodeday: string;
            skytextday: string;
            date: string;
            day: string;
            shortday: string;
            precip: string;
        },
        {
            low: string;
            high: string;
            skycodeday: string;
            skytextday: string;
            date: string;
            day: string;
            shortday: string;
            precip: string;
        }
    ];
}

declare module "weather-js" {
    const find: (
        options: WeatherJSOptions,
        callback: (error: Error | string | null, result: WeatherJSResult[]) => any
    ) => void;
}
