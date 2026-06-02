"""
One-time script: add missing programming language skills to existing DB.
Safe to run multiple times — skips already existing skills.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from skills.models import Skill
from categories.models import Category

NEW_SKILLS = {
    "web-dev": [
        ("C#",         "csharp"),
        ("C++",        "cpp"),
        ("C",          "c"),
        ("Java",       "java"),
        ("Go",         "go"),
        ("Rust",       "rust"),
        ("PHP",        "php"),
        ("Ruby",       "ruby"),
        ("Python",     "python-web"),
        ("Next.js",    "nextjs"),
        ("Nuxt.js",    "nuxtjs"),
        ("Django",     "django"),
        ("Laravel",    "laravel"),
        ("Spring",     "spring"),
        ("MongoDB",    "mongodb"),
        ("Redis",      "redis"),
        ("GraphQL",    "graphql"),
        ("REST API",   "rest-api"),
        ("Bash",       "bash"),
        (".NET",       "dotnet"),
    ],
    "data-ai": [
        ("R",              "r-lang"),
        ("Scala",          "scala"),
        ("Jupyter",        "jupyter"),
        ("NumPy",          "numpy"),
        ("Scikit-learn",   "sklearn"),
        ("OpenCV",         "opencv"),
        ("LangChain",      "langchain"),
    ],
    "mobile-dev": [
        ("Objective-C",    "objc"),
        ("Xamarin",        "xamarin"),
        ("Ionic",          "ionic"),
    ],
    "devops": [
        ("Linux",          "linux"),
        ("Nginx",          "nginx"),
        ("CI/CD",          "cicd"),
        ("Ansible",        "ansible"),
        ("GCP",            "gcp"),
        ("Azure",          "azure"),
    ],
}

def main():
    db = SessionLocal()
    added = 0
    skipped = 0

    for cat_slug, skills in NEW_SKILLS.items():
        cat = db.query(Category).filter(Category.slug == cat_slug).first()
        if not cat:
            print(f"  CATEGORY NOT FOUND: {cat_slug}")
            continue
        for name, slug in skills:
            exists = db.query(Skill).filter(Skill.slug == slug).first()
            if exists:
                skipped += 1
                continue
            db.add(Skill(name=name, slug=slug, category_id=cat.id))
            print(f"  + {name} ({slug}) → {cat_slug}")
            added += 1

    db.commit()
    db.close()
    print(f"\nDone: {added} added, {skipped} skipped.")

if __name__ == "__main__":
    main()
