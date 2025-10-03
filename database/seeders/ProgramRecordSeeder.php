<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProgramRecord;

class ProgramRecordSeeder extends Seeder
{
    public function run(): void
    {
        $records = [
            // Doctorate Programs
            ['name'=>'Doctor in Business Management','program'=>'DBM','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor in Business Management Specialized in Information Systems','program'=>'DBM-IS','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Education, Major in: Applied Linguistics','program'=>'PHDED-AL','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Education, Major in: Educational Leadership','program'=>'PHDED-EL','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Education, Major in: Counseling','program'=>'PHDED-C','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Education, Major in: Filipino','program'=>'PHDED-FIL','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Education, Major in: Information Technology Integration','program'=>'PHDED-ITI','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Education, Major in: Mathematics','program'=>'PHDED-MATH','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Education, Major in: Physical Education','program'=>'PHDED-PE','category'=>'Doctorate','date_edited'=>'2025-08-08'],
            ['name'=>'Doctor of Philosophy in Pharmacy','program'=>'PHD-PHARM','category'=>'Doctorate','date_edited'=>'2025-08-08'],

            // Masters Programs
            ['name'=>'Master of Arts in Educational Management','program'=>'MAEM','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Elementary Education','program'=>'MAEE','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Education, Major in: English','program'=>'MAED-ENG','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Education, Major in: Filipino','program'=>'MAED-FIL','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Education, Major in: Information Technology Integration','program'=>'MAED-ITI','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Education, Major in: Mathematics','program'=>'MAED-MATH','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Education, Major in: Music Education','program'=>'MAED-ME','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Education, Major in: Physical Education','program'=>'MAED-PE','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Education, Major in: Sociology','program'=>'MAED-SOC','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Religious Education','program'=>'MARE','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Values Education','program'=>'MAVE','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Teaching Chemistry','program'=>'MATCHEM','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Teaching Physics','program'=>'MATPHY','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master in Engineering Education, Major in: Civil Engineering','program'=>'MEE-CE','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master in Engineering Education, Major in: Electronics and Communications Engineering','program'=>'MEE-ECE','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master in Information System','program'=>'MIS','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master in Information Technology','program'=>'MIT','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Science in Medical Technology, Major in: Biomedical Science','program'=>'MSMT-BS','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Science in Medical Technology, Major in: Laboratory Leadership and Management','program'=>'MSMT-LLM','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Science in Medical Technology, Major in: Medical Laboratory Science Education and Management','program'=>'MSMT-MLSEM','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Science in Medical Technology, Major in: Community Health','program'=>'MSMT-CH','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Science in Pharmacy','program'=>'MSPHARM','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master of Arts in Counseling','program'=>'MAC','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master in Pastoral Ministry (Non-Thesis), Specialized in: Family Ministry and Counseling','program'=>'MPM-FMC','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master in Pastoral Ministry (Non-Thesis), Specialized in: Pastoral Management','program'=>'MPM-PM','category'=>'Masters','date_edited'=>'2025-08-08'],
            ['name'=>'Master in Pastoral Ministry (Non-Thesis), Specialized in: Retreat Giving and Spirituality','program'=>'MPM-RGS','category'=>'Masters','date_edited'=>'2025-08-08'],
        ];

        foreach ($records as $record) {
            ProgramRecord::create($record);
        }
    }
}
