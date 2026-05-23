import { NextRequest, NextResponse } from "next/server";
import Handlebars from "handlebars";

export async function POST(req: NextRequest) {
    try {
        const { htmlContent, mockData } = await req.json();

        if (htmlContent === undefined) {
            return NextResponse.json({ error: "htmlContent is required" }, { status: 400 });
        }

        // Complie the Handlebars template with mock data
        const template = Handlebars.compile(htmlContent);
        const compiledHtml = template(mockData || {});

        return NextResponse.json({ compiledHtml });
    } catch (error: any) {
        console.error("[EmailPreviewAPI] Compilation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
